"use client";

import { Icon } from "@/components/Icon";

export function SpeakerButton({ text, label, onSpeak, speaking = false }: { text: string; label: string; onSpeak: (text: string, label: string) => void; speaking?: boolean }) {
  return <button className="speaker-button" type="button" onClick={() => onSpeak(text, label)} aria-label={speaking ? `Stop speaking ${label.toLowerCase()}` : label} data-speaking={speaking ? "true" : "false"} title={speaking ? "Stop speaking" : "Read aloud"}>
    <Icon name={speaking ? "close" : "sound"} size={18} />
    <span className="sr-only">{speaking ? "Stop speaking" : "Read aloud"}</span>
  </button>;
}

