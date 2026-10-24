"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraState = "idle" | "requesting" | "waiting" | "active" | "stopped" | "error";

function cameraError(error: unknown): string {
  if (error instanceof DOMException) {
    if (["NotAllowedError", "SecurityError"].includes(error.name)) return "Camera permission was denied. Allow camera access in browser settings, then try again.";
    if (["NotFoundError", "DevicesNotFoundError"].includes(error.name)) return "No camera was found. Connect a camera and try again.";
    if (["NotReadableError", "TrackStartError"].includes(error.name)) return "The camera is busy or unavailable. Close other apps using it, then retry.";
    if (error.name === "OverconstrainedError") return "This camera could not use the requested mode. Try another camera or browser.";
    if (error.name === "AbortError") return `Camera playback was interrupted before video began${error.message ? `: ${error.message}` : ""}. Close other camera tabs or apps, then retry.`;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Camera access failed. Check permission and use HTTPS or localhost.";
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const requestId = useRef(0);
  const requestPending = useRef(false);
  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);

  const stopTracks = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  }, []);

  const failPreview = useCallback((message: string, stream: MediaStream) => {
    if (!mounted.current || streamRef.current !== stream) return;
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    stopTracks(stream);
    setError(message);
    setState("error");
  }, [stopTracks]);

  const stop = useCallback(() => {
    requestId.current += 1;
    requestPending.current = false;
    const stream = streamRef.current;
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    stopTracks(stream);
    setError(null);
    setState("stopped");
  }, [stopTracks]);

  const start = useCallback(async () => {
    if (state === "requesting" || requestPending.current) return false;
    if (state === "waiting" || state === "active") return true;
    setError(null);

    if (typeof window === "undefined" || !window.isSecureContext) {
      const message = "Camera access requires HTTPS or localhost. Open this app on a secure connection.";
      setError(message);
      setState("error");
      return false;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      const message = "This browser does not support camera access. Try a current browser over HTTPS or localhost.";
      setError(message);
      setState("error");
      return false;
    }

    requestPending.current = true;
    const currentRequest = ++requestId.current;
    setState("requesting");

    try {
      // `ideal` prefers the rear camera on phones without making that constraint mandatory.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      } catch (primaryError) {
        if (!(primaryError instanceof DOMException) || primaryError.name !== "OverconstrainedError") throw primaryError;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (!mounted.current || currentRequest !== requestId.current) {
        stopTracks(stream);
        return false;
      }
      const track = stream.getVideoTracks()[0];
      if (!track || track.readyState !== "live") {
        stopTracks(stream);
        throw new Error("The camera opened without a live video track. Check the device and try again.");
      }

      streamRef.current = stream;
      track.addEventListener("ended", () => {
        if (!mounted.current || streamRef.current !== stream) return;
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setError("The camera stopped unexpectedly. Check the camera and try again.");
        setState("error");
      }, { once: true });
      requestPending.current = false;
      setState("waiting");
      return true;
    } catch (cause) {
      if (mounted.current && currentRequest === requestId.current) {
        requestPending.current = false;
        setError(cameraError(cause));
        setState("error");
      }
      return false;
    }
  }, [state, stopTracks]);

  const attachPreview = useCallback(() => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) {
      if (stream) failPreview("Camera started, but the preview could not be attached. Retry the camera.", stream);
      return;
    }

    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      failPreview("Camera permission was granted, but no video frames arrived. Check the camera shutter or device, then retry.", stream);
    }, 5000);
    const markPlaying = () => {
      if (settled || streamRef.current !== stream) return;
      if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        settled = true;
        window.clearTimeout(timeout);
        setError(null);
        setState("active");
      }
    };
    video.onloadedmetadata = markPlaying;
    video.onplaying = markPlaying;
    video.srcObject = stream;
    void video.play().then(markPlaying).catch((cause: unknown) => {
      if (settled) return;
      if (process.env.NODE_ENV !== "production") {
        console.debug("[Ivision camera] video.play() rejected", { name: cause instanceof Error ? cause.name : "unknown", message: cause instanceof Error ? cause.message : String(cause), readyState: video.readyState, videoWidth: video.videoWidth, videoHeight: video.videoHeight, trackState: stream.getVideoTracks()[0]?.readyState });
      }
      const message = cause instanceof DOMException && cause.name === "NotAllowedError"
        ? "The browser blocked camera playback. Tap Retry to start the preview."
        : `Camera preview could not start. ${cameraError(cause)}`;
      settled = true;
      window.clearTimeout(timeout);
      failPreview(message, stream);
    });

    return () => {
      settled = true;
      window.clearTimeout(timeout);
      video.onloadedmetadata = null;
      video.onplaying = null;
      if (video.srcObject === stream) {
        video.pause();
        video.srcObject = null;
      }
    };
  }, [failPreview]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current += 1;
      requestPending.current = false;
      const stream = streamRef.current;
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      stopTracks(stream);
    };
  }, [stopTracks]);

  return { videoRef, state, error, start, stop, attachPreview };
}





