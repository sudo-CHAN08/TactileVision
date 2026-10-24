"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { CameraState } from "@/hooks/useCamera";

export type SpatialFeedState = "idle" | "connecting" | "connected" | "reconnecting" | "error";
const FRAME_INTERVAL_MS = 100;
type BackendSeverity = "clear" | "warning" | "critical";
type BackendZone = "left" | "center" | "right";
export type SpatialAnalysis = {
  has_hazard: boolean;
  alignment: "aligned" | "tilted_down" | "tilted_up";
  primary_threat: { zone: BackendZone; distance_m: number; severity: Exclude<BackendSeverity, "clear">; timestamp: number } | null;
  sectors: Record<BackendZone, { distance_m: number; severity: BackendSeverity }>;
  inference_ms: number;
};

function spatialFeedUrl() {
  const configured = process.env.NEXT_PUBLIC_WS_URL;
  if (configured) return configured;
  if (typeof window === "undefined") return "ws://localhost:8000/ws/spatial-feed";
  return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:8000/ws/spatial-feed`;
}

function frameFrom(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  if (!video.videoWidth || !video.videoHeight) return null;
  const scale = Math.min(1, 480 / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

function parseAnalysis(value: unknown): SpatialAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Partial<SpatialAnalysis>;
  if (typeof result.has_hazard !== "boolean") return null;
  if (result.has_hazard && !result.primary_threat) return null;
  return result as SpatialAnalysis;
}

export function useSpatialFeed(videoRef: RefObject<HTMLVideoElement | null>, cameraState: CameraState, onAnalysis: (analysis: SpatialAnalysis) => void) {
  const [state, setState] = useState<SpatialFeedState>("idle");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);
  const retryRef = useRef(0);
  const inFlightRef = useRef(false);
  const onAnalysisRef = useRef(onAnalysis);

  useEffect(() => { onAnalysisRef.current = onAnalysis; }, [onAnalysis]);
  useEffect(() => {
    if (cameraState !== "active") {
      stoppedRef.current = true;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
      inFlightRef.current = false;
      retryRef.current = 0;
      setState("idle"); setError(null);
      return;
    }
    stoppedRef.current = false;
    canvasRef.current ??= document.createElement("canvas");
    const connect = () => {
      if (stoppedRef.current) return;
      setState(retryRef.current ? "reconnecting" : "connecting");
      const socket = new WebSocket(spatialFeedUrl());
      socketRef.current = socket;
      const scheduleFrame = () => { if (!stoppedRef.current) timerRef.current = window.setTimeout(sendFrame, FRAME_INTERVAL_MS); };
      const sendFrame = () => {
        if (stoppedRef.current || socket.readyState !== WebSocket.OPEN || inFlightRef.current) return;
        const video = videoRef.current; const canvas = canvasRef.current;
        if (!video || !canvas) return scheduleFrame();
        const frame = frameFrom(video, canvas);
        if (!frame) return scheduleFrame();
        inFlightRef.current = true; socket.send(frame);
      };
      socket.onopen = () => { retryRef.current = 0; setError(null); setState("connected"); scheduleFrame(); };
      socket.onmessage = (event) => {
        inFlightRef.current = false;
        try {
          const analysis = parseAnalysis(JSON.parse(String(event.data)));
          if (!analysis) throw new Error("The vision service returned an invalid analysis.");
          onAnalysisRef.current(analysis);
        } catch (cause) { setError(cause instanceof Error ? cause.message : "The vision service returned unreadable data."); }
        scheduleFrame();
      };
      socket.onerror = () => setError("Could not reach the vision service.");
      socket.onclose = () => {
        inFlightRef.current = false;
        if (stoppedRef.current) return;
        retryRef.current += 1; setState("reconnecting");
        timerRef.current = window.setTimeout(connect, Math.min(1_000 * retryRef.current, 5_000));
      };
    };
    connect();
    return () => { stoppedRef.current = true; if (timerRef.current !== null) window.clearTimeout(timerRef.current); socketRef.current?.close(); socketRef.current = null; };
  }, [cameraState, videoRef]);
  return { state, error };
}
