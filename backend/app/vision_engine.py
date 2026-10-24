"""Depth Anything V2 Metric Indoor inference engine and spatial analyzer with cluster recognition."""

import time
import cv2
import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

# Safe import fallback
try:
    from backend.app.schemas import AnalysisResult, HazardEvent, SectorData, ClusterData
except ImportError:
    from app.schemas import AnalysisResult, HazardEvent, SectorData, ClusterData


DEFAULT_MODEL_ID = "depth-anything/Depth-Anything-V2-Metric-Indoor-Small-hf"


class DepthEngine:
    """Load a depth model once and reuse it for multiple images."""

    def __init__(self, model_id: str = DEFAULT_MODEL_ID):
        if torch.backends.mps.is_available():
            self.device = "mps"
        elif torch.cuda.is_available():
            self.device = "cuda"
        else:
            self.device = "cpu"

        print(f"Loading depth model on {self.device}...")

        self.processor = AutoImageProcessor.from_pretrained(model_id)
        self.model = AutoModelForDepthEstimation.from_pretrained(model_id)
        self.model.to(self.device)
        self.model.eval()

        print("Depth model ready!")

    def infer_depth_map(self, image: Image.Image) -> dict:
        """Return a predicted depth map and full processing latency."""

        if not isinstance(image, Image.Image):
            raise TypeError("image must be a PIL Image")

        image = image.convert("RGB")

        # 4:3 Aspect-ratio preservation
        inputs = self.processor(
            images=image, 
            size={"height": 252, "width": 336}, 
            return_tensors="pt"
        )
        inputs = {key: value.to(self.device) for key, value in inputs.items()}

        start = time.perf_counter()

        with torch.inference_mode():
            outputs = self.model(**inputs)
            if self.device == "mps":
                torch.mps.synchronize()

        # Rescale metric depth back to original image size
        predicted_depth = torch.nn.functional.interpolate(
            outputs.predicted_depth.unsqueeze(1),
            size=image.size[::-1],
            mode="bicubic",
            align_corners=False,
        ).squeeze()

        depth = predicted_depth.float().cpu().numpy()
        elapsed = time.perf_counter() - start

        return {
            "depth_map": depth,
            "input_size": image.size,
            "depth_shape": depth.shape,
            "min": float(np.nanmin(depth)),
            "max": float(np.nanmax(depth)),
            "mean": float(np.nanmean(depth)),
            "all_finite": bool(np.isfinite(depth).all()),
            "inference_seconds": elapsed,
            "device": self.device,
        }


class SpatialAnalyzer:
    """Partitions depth maps into Left, Center, Right sectors and extracts object clusters."""

    def __init__(
        self,
        hazard_corridor_ratio: float = 0.70,
        critical_distance_m: float = 0.9,
        warning_distance_m: float = 3.5,
        max_valid_distance_m: float = 6.0,
        min_cluster_pixels: int = 90  # Detect smaller nearby objects while rejecting isolated noise
    ):
        self.corridor_ratio = hazard_corridor_ratio
        self.critical_dist = critical_distance_m
        self.warning_dist = warning_distance_m
        self.max_valid_dist = max_valid_distance_m
        self.min_cluster_pixels = min_cluster_pixels

    def check_alignment(self, depth_map: np.ndarray) -> str:
        h = depth_map.shape[0]
        bottom_strip = depth_map[int(h * 0.80):, :]
        valid_pixels = bottom_strip[(bottom_strip > 0.05) & (bottom_strip < 4.0)]

        if len(valid_pixels) > 50:
            median_floor_dist = float(np.median(valid_pixels))
            if median_floor_dist < 0.75:
                return "tilted_down"
        return "aligned"

    def extract_clusters(self, corridor: np.ndarray, frame_width: int) -> list:
        """Groups hazardous pixels into discrete spatial clusters with bounding boxes."""
        # Lowered lower bound from 0.15 to 0.05 for sub-meter detection
        hazard_mask = ((corridor > 0.05) & (corridor <= self.warning_dist)).astype(np.uint8) * 255

        # Extract connected components
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(hazard_mask)

        sector_w = frame_width // 3
        clusters = []

        for i in range(1, num_labels):  # Skip background label 0
            area = stats[i, cv2.CC_STAT_AREA]
            if area >= self.min_cluster_pixels:
                x = int(stats[i, cv2.CC_STAT_LEFT])
                y = int(stats[i, cv2.CC_STAT_TOP])
                w = int(stats[i, cv2.CC_STAT_WIDTH])
                h = int(stats[i, cv2.CC_STAT_HEIGHT])
                cx, cy = float(centroids[i][0]), float(centroids[i][1])

                # Determine zone based on centroid x-position
                if cx < sector_w:
                    zone = "left"
                elif cx < 2 * sector_w:
                    zone = "center"
                else:
                    zone = "right"

                cluster_depths = corridor[labels == i]
                median_dist = float(np.median(cluster_depths))

                clusters.append(ClusterData(
                    cluster_id=i,
                    bounding_box=[x, y, w, h],
                    centroid=[round(cx, 1), round(cy, 1)],
                    pixel_count=int(area),
                    distance_m=float(round(median_dist, 2)),
                    zone=zone
                ))

        return clusters

    def analyze(self, depth_input, inference_ms: float = 0.0) -> AnalysisResult:
        if isinstance(depth_input, dict):
            depth_map = depth_input.get("depth_map")
            if inference_ms == 0.0 and "inference_seconds" in depth_input:
                inference_ms = depth_input["inference_seconds"] * 1000.0
        else:
            depth_map = depth_input

        depth_map = np.asarray(depth_map)
        if depth_map.ndim != 2 or depth_map.size == 0:
            raise ValueError("depth_map must be a non-empty 2D numpy array")

        h, w = depth_map.shape
        alignment_status = self.check_alignment(depth_map)

        upper_limit = int(h * self.corridor_ratio)
        corridor = depth_map[:upper_limit, :]

        # Extract discrete object clusters
        clusters = self.extract_clusters(corridor, w)

        # Partition into 3 sectors
        sector_w = w // 3
        zones = {
            "left": corridor[:, :sector_w],
            "center": corridor[:, sector_w : 2 * sector_w],
            "right": corridor[:, 2 * sector_w :]
        }

        sectors = {}
        primary_threat = None
        min_hazard_dist = float("inf")

        for zone_name, zone_depth in zones.items():
            # Lowered threshold to 0.05 for sub-meter accuracy
            valid_pixels = zone_depth[(zone_depth > 0.05) & (zone_depth <= self.max_valid_dist)]

            if len(valid_pixels) < 30:
                dist = self.max_valid_dist
                severity = "clear"
            else:
                # 5th percentile catches the closest leading edge of obstacles
                dist = float(np.percentile(valid_pixels, 5))
                if dist < self.critical_dist:
                    severity = "critical"
                elif dist < self.warning_dist:
                    severity = "warning"
                else:
                    severity = "clear"

            sectors[zone_name] = SectorData(
                distance_m=float(round(dist, 2)),
                severity=severity
            )

            if severity != "clear" and dist < min_hazard_dist:
                min_hazard_dist = dist
                primary_threat = HazardEvent(
                    zone=zone_name,
                    distance_m=float(round(dist, 2)),
                    severity=severity,
                    timestamp=int(time.time() * 1000),
                    type="hazard"
                )

        return AnalysisResult(
            has_hazard=primary_threat is not None,
            primary_threat=primary_threat,
            sectors=sectors,
            clusters=clusters,
            inference_ms=round(inference_ms, 1),
            alignment=alignment_status
        )
