"use client";

import type { CameraState } from "@/hooks/useCamera";
import type { SpatialFeedState } from "@/hooks/useSpatialFeed";

export function ConnectionStatus({ cameraState, spatialState }: { cameraState: CameraState; spatialState: SpatialFeedState }) {
  const cameraText = cameraState === "active" ? "Camera preview ready"
    : cameraState === "waiting" ? "Waiting for camera video"
      : cameraState === "requesting" ? "Requesting camera permission"
        : cameraState === "error" ? "Camera unavailable"
          : cameraState === "stopped" ? "Camera stopped" : "Camera off";
  const spatialText = spatialState === "connected" ? "Hazard detection live"
    : spatialState === "connecting" || spatialState === "reconnecting" ? "Connecting vision service"
      : spatialState === "error" ? "Vision service unavailable" : "Hazard detection standby";
  return (
    <div className="header-status" aria-label={`${cameraText}. ${spatialText}.`}>
      <span className={`status-dot ${cameraState === "active" ? "status-dot-on" : cameraState === "error" ? "status-dot-error" : ""}`} aria-hidden="true" />
      <span>{cameraText}</span>
      <span className="status-separator" aria-hidden="true">·</span>
      <span className={spatialState === "connected" ? "service-available" : "service-unavailable"}>{spatialText}</span>
    </div>
  );
}
