# backend/app/schemas.py
from pydantic import BaseModel
from typing import Optional, Dict, List, Literal

Severity = Literal["clear", "warning", "critical"]
Zone = Literal["left", "center", "right"]
AlignmentStatus = Literal["aligned", "tilted_down", "tilted_up"]

class ClusterData(BaseModel):
    cluster_id: int
    bounding_box: List[int]  # [x, y, width, height]
    centroid: List[float]    # [x, y]
    pixel_count: int
    distance_m: float
    zone: Zone

class SectorData(BaseModel):
    distance_m: float
    severity: Severity

class HazardEvent(BaseModel):
    type: Literal["hazard"] = "hazard"
    zone: Zone
    distance_m: float
    severity: Literal["warning", "critical"]
    timestamp: int

class AnalysisResult(BaseModel):
    has_hazard: bool
    alignment: AlignmentStatus = "aligned"
    primary_threat: Optional[HazardEvent] = None
    sectors: Dict[Zone, SectorData]
    clusters: List[ClusterData] = []  # <--- Added cluster recognition list
    inference_ms: float