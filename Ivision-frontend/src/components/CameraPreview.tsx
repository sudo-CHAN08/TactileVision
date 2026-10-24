"use client";

import { useEffect, type RefObject } from "react";
import type { CameraState } from "@/hooks/useCamera";

export function CameraPreview({ videoRef, state, attachPreview }: { videoRef: RefObject<HTMLVideoElement | null>; state: CameraState; attachPreview: () => (() => void) | void }) {
  const visible = state === "waiting" || state === "active";
  const ready = state === "active";
  useEffect(() => {
    if (!visible) return;
    return attachPreview();
  }, [visible, attachPreview]);
  return (
    <section className="live-preview" hidden={!visible} aria-labelledby="preview-heading">
      <div className="preview-heading"><span id="preview-heading">{ready ? "Live camera preview" : "Starting camera preview"}</span><span><i aria-hidden="true" /> {ready ? "Video ready" : "Waiting for video"}</span></div>
      <video ref={videoRef} autoPlay muted playsInline aria-label={ready ? "Live camera video. Hazard processing is not connected." : "Camera preview is initializing."} />
      {!ready && <p className="preview-wait">Waiting for camera video…</p>}
    </section>
  );
}


