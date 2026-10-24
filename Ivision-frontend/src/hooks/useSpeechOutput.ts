"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpokenMessage = { text: string; label: string; spokenAt: number };

export function useSpeechOutput(onUnsupported: () => void, language = "system") {
  const [speakingLabel, setSpeakingLabel] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<SpokenMessage | null>(null);
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    activeUtterance.current = null;
    setSpeakingLabel(null);
  }, []);

  const speak = useCallback((text: string, label: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      onUnsupported();
      return;
    }
    if (speakingLabel === label && window.speechSynthesis.speaking) {
      stop();
      return;
    }
    window.speechSynthesis.cancel();
    setLastMessage({ text, label, spokenAt: Date.now() });
    const utterance = new SpeechSynthesisUtterance(text);
    const requestedLanguage = language === "system" ? navigator.language : language;
    utterance.lang = requestedLanguage;
    const normalizedLanguage = requestedLanguage.toLowerCase();
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((candidate) => candidate.lang.toLowerCase() === normalizedLanguage)
      ?? voices.find((candidate) => candidate.lang.toLowerCase().startsWith(normalizedLanguage.split("-")[0]));
    if (voice) utterance.voice = voice;
    activeUtterance.current = utterance;
    utterance.onend = () => {
      if (activeUtterance.current === utterance) {
        activeUtterance.current = null;
        setSpeakingLabel(null);
      }
    };
    utterance.onerror = () => {
      if (activeUtterance.current === utterance) {
        activeUtterance.current = null;
        setSpeakingLabel(null);
        onUnsupported();
      }
    };
    setSpeakingLabel(label);
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      activeUtterance.current = null;
      setSpeakingLabel(null);
      onUnsupported();
    }
  }, [language, onUnsupported, speakingLabel, stop]);

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return { speak, stop, speakingLabel, lastMessage };
}
