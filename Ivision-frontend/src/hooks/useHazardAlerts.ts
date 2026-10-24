"use client";

import { useCallback, useRef, useState } from "react";
import { type HazardEvent, type HazardInput, parseHazardEvent, severityRank } from "@/types/hazard";
import { localizeHazardSpeech } from "@/lib/speechText";

const MAX_QUEUE = 4;
const DEDUPE_WINDOW_MS = 2_000;

function signature(event: HazardEvent) {
  const distance = event.distance_m === undefined ? "unknown-distance" : Math.round(event.distance_m * 4) / 4;
  return [event.hazard.toLowerCase(), event.direction, event.severity, distance].join("|");
}

export function useHazardAlerts(options: { audioEnabled: boolean; speechEnabled: boolean; vibrationEnabled: boolean; speechLanguage: string }) {
  const [latest, setLatest] = useState<HazardEvent | null>(null);
  const [latestReceivedAt, setLatestReceivedAt] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [message, setMessage] = useState("");
  const [queuedCount, setQueuedCount] = useState(0);
  const seen = useRef(new Map<string, number>());
  const queue = useRef<HazardEvent[]>([]);
  const speaking = useRef(false);
  const speechGeneration = useRef(0);
  const audioContext = useRef<AudioContext | null>(null);

  const unlockAudio = useCallback(async () => {
    if (typeof window === "undefined" || !window.AudioContext) return;
    try {
      audioContext.current ??= new AudioContext();
      if (audioContext.current.state === "suspended") await audioContext.current.resume();
    } catch {
      // Audio is optional; the visual and screen-reader alert remains available.
    }
  }, []);

  const beep = useCallback(async (severity: HazardEvent["severity"], direction: HazardEvent["direction"]) => {
    if (!options.audioEnabled || typeof window === "undefined" || !window.AudioContext) return;
    try {
      audioContext.current ??= new AudioContext();
      if (audioContext.current.state === "suspended") await audioContext.current.resume();
      const context = audioContext.current;
      const count = severity === "critical" ? 3 : severity === "high" ? 2 : 1;
      const isLeft = direction === "left" || direction === "front-left";
      const isRight = direction === "right" || direction === "front-right";
      const directionFrequency = isLeft ? 520 : isRight ? 920 : 720;
      const pan = isLeft ? -0.8 : isRight ? 0.8 : 0;
      for (let index = 0; index < count; index += 1) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startsAt = context.currentTime + index * 0.2;
        oscillator.frequency.value = directionFrequency + (severity === "critical" ? 120 : severity === "high" ? 60 : 0);
        gain.gain.setValueAtTime(0.0001, startsAt);
        gain.gain.exponentialRampToValueAtTime(0.45, startsAt + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.16);
        if (typeof context.createStereoPanner === "function") {
          const panner = context.createStereoPanner();
          panner.pan.value = pan;
          oscillator.connect(gain).connect(panner).connect(context.destination);
        } else {
          oscillator.connect(gain).connect(context.destination);
        }
        oscillator.start(startsAt);
        oscillator.stop(startsAt + 0.18);
      }
    } catch {
      // Audio is optional; the visual and screen-reader alert remains available.
    }
  }, [options.audioEnabled]);

  const vibrate = useCallback((severity: HazardEvent["severity"]) => {
    if (!options.vibrationEnabled || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    const pattern = severity === "critical" ? [220, 70, 220, 70, 220]
      : severity === "high" ? [160, 80, 160]
        : severity === "medium" ? [100, 70, 100]
          : [70];
    navigator.vibrate(pattern);
  }, [options.vibrationEnabled]);
  const speakNext = useCallback(() => {
    if (speaking.current || !options.speechEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    const event = queue.current.shift();
    setQueuedCount(queue.current.length);
    if (!event) return;

    speaking.current = true;
    setIsSpeaking(true);
    const generation = speechGeneration.current;

    const language = options.speechLanguage === "system" ? navigator.language : options.speechLanguage;
    const utterance = new SpeechSynthesisUtterance(localizeHazardSpeech(event, options.speechLanguage));
    utterance.lang = language;
    const baseLanguage = language.toLowerCase().split("-")[0];
    const selectedVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase() === language.toLowerCase())
      ?? window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith(baseLanguage));
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onend = utterance.onerror = () => {
      if (generation !== speechGeneration.current) return;
      speaking.current = false;
      setIsSpeaking(false);
      speakNext();
    };
    window.speechSynthesis.speak(utterance);
  }, [options.speechEnabled, options.speechLanguage]);

  const handleHazardEvent = useCallback((input: HazardInput) => {
    const event = parseHazardEvent(input);
    if (!event) {
      setMessage("Hazard data could not be read. No live detection was confirmed.");
      return null;
    }

    const now = Date.now();
    for (const [key, timestamp] of seen.current) {
      if (now - timestamp > DEDUPE_WINDOW_MS) seen.current.delete(key);
    }
    const key = signature(event);
    if (seen.current.has(key)) return null;
    seen.current.set(key, now);

    setLatest(event);
    setLatestReceivedAt(now);
    setMessage(`${event.severity} alert: ${event.hazard}, ${event.direction.replaceAll("-", " ")}${event.distance_m === undefined ? "" : `, ${event.distance_m} meters away`}.`);
    void beep(event.severity, event.direction);
    vibrate(event.severity);

    if (options.speechEnabled) {
      queue.current.push(event);
      queue.current.sort((first, second) => severityRank[second.severity] - severityRank[first.severity]);
      if (queue.current.length > MAX_QUEUE) queue.current.length = MAX_QUEUE;
      setQueuedCount(queue.current.length);
      speakNext();
    }
    return event;
  }, [beep, options.speechEnabled, speakNext, vibrate]);

  const cancelSpeech = useCallback(() => {
    speechGeneration.current += 1;
    queue.current = [];
    speaking.current = false;
    setIsSpeaking(false);
    setQueuedCount(0);
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const clear = useCallback(() => {
    seen.current.clear();
    setLatest(null);
    setLatestReceivedAt(null);
    setMessage("");
    cancelSpeech();
  }, [cancelSpeech]);

  return { latest, latestReceivedAt, message, queuedCount, isSpeaking, handleHazardEvent, unlockAudio, cancelSpeech, clear };
}




