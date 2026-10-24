"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Alignment = "aligned" | "tilted_down" | "tilted_up";
type SensorState = "inactive" | "waiting" | "ready" | "permission_required" | "denied" | "unsupported";
type PermissionOrientationEvent = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<PermissionState> };

export function useCameraAlignment() {
  const [pitch, setPitch] = useState(90);
  const [status, setStatus] = useState<Alignment>("aligned");
  const [sensorState, setSensorState] = useState<SensorState>("inactive");
  const attached = useRef(false);
  const received = useRef(false);
  const requestGeneration = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const handleRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);

  const attach = useCallback(() => {
    if (attached.current || typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null) return;
      const currentPitch = Math.abs(event.beta);
      received.current = true;
      setPitch(Math.round(currentPitch));
      setSensorState("ready");
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      setStatus((previous) => {
        if (previous === "tilted_down" && currentPitch < 75) return "tilted_down";
        if (previous === "tilted_up" && currentPitch > 100) return "tilted_up";
        if (currentPitch < 70) return "tilted_down";
        if (currentPitch > 105) return "tilted_up";
        return "aligned";
      });
    };
    handleRef.current = handleOrientation;
    window.addEventListener("deviceorientation", handleOrientation);
    attached.current = true;
    received.current = false;
    setSensorState("waiting");
    timeoutRef.current = window.setTimeout(() => {
      if (!received.current) setSensorState("unsupported");
    }, 3000);
  }, []);

  const requestAccess = useCallback(async () => {
    const generation = ++requestGeneration.current;
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setSensorState("unsupported");
      return;
    }
    const orientation = DeviceOrientationEvent as PermissionOrientationEvent;
    try {
      if (typeof orientation.requestPermission === "function") {
        setSensorState("permission_required");
        const permission = await orientation.requestPermission();
        if (generation !== requestGeneration.current) return;
        if (permission !== "granted") {
          setSensorState("denied");
          return;
        }
      }
      if (generation === requestGeneration.current) attach();
    } catch {
      if (generation === requestGeneration.current) setSensorState("denied");
    }
  }, [attach]);

  const stop = useCallback(() => {
    requestGeneration.current += 1;
    if (typeof window !== "undefined" && timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    if (typeof window !== "undefined" && handleRef.current) window.removeEventListener("deviceorientation", handleRef.current);
    handleRef.current = null;
    attached.current = false;
    received.current = false;
    setSensorState("inactive");
  }, []);

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    if (handleRef.current) window.removeEventListener("deviceorientation", handleRef.current);
  }, []);

  return { pitch, status, sensorState, requestAccess, stop };
}


