"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionResult = ArrayLike<{ transcript: string }>;
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;
type VoiceState = "off" | "listening" | "processing" | "unsupported" | "error";

function getRecognitionConstructor(): RecognitionConstructor | undefined {
  const browser = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

export function useVoiceCommands(onCommand: (command: string) => void, onStatus: (message: string) => void) {
  const [state, setState] = useState<VoiceState>("off");
  const recognition = useRef<Recognition | null>(null);
  const callbacks = useRef({ onCommand, onStatus });
  callbacks.current = { onCommand, onStatus };

  const cancel = useCallback(() => {
    recognition.current?.abort();
    recognition.current = null;
    setState("off");
  }, []);

  const start = useCallback(() => {
    if (state === "listening" || state === "processing") return;
    const Constructor = getRecognitionConstructor();
    if (!Constructor) {
      setState("unsupported");
      callbacks.current.onStatus("Voice commands are not supported here. Use the buttons or Find form.");
      return;
    }

    try {
      const instance = new Constructor();
      recognition.current = instance;
      instance.lang = navigator.language || "en-US";
      instance.interimResults = false;
      instance.maxAlternatives = 1;
      instance.onstart = () => {
        setState("listening");
        callbacks.current.onStatus("Listening for one command. Microphone is on.");
      };
      instance.onresult = (event) => {
        const command = event.results[0]?.[0]?.transcript?.trim();
        if (!command) {
          setState("error");
          callbacks.current.onStatus("No command heard. Start voice command to try again.");
          return;
        }
        setState("processing");
        callbacks.current.onStatus("Processing command.");
        callbacks.current.onCommand(command);
      };
      instance.onerror = (event) => {
        setState(event.error === "not-allowed" ? "error" : "unsupported");
        callbacks.current.onStatus(event.error === "not-allowed"
          ? "Microphone permission was denied. Change the site permission and try again."
          : "Voice recognition is unavailable. Use the buttons or Find form.");
      };
      instance.onend = () => {
        recognition.current = null;
        setState((current) => current === "listening" || current === "processing" ? "off" : current);
      };
      setState("listening");
      callbacks.current.onStatus("Requesting microphone access. Your browser may ask for permission.");
      instance.start();
    } catch {
      recognition.current = null;
      setState("error");
      callbacks.current.onStatus("Voice commands could not start. Check microphone permission or use the buttons.");
    }
  }, [state]);

  useEffect(() => () => {
    recognition.current?.abort();
    recognition.current = null;
  }, []);

  return { state, start, cancel };
}
