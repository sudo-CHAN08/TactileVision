"use client";

import { Icon, type IconName } from "@/components/Icon";
import { SpeakerButton } from "@/components/SpeakerButton";

export type TaskAction = "describe" | "identify" | "read" | "find";

const actions: Array<{ id: TaskAction; label: string; description: string; icon: IconName; tone: string }> = [
  { id: "describe", label: "Describe scene", description: "Get a concise spoken overview of the scene.", icon: "sparkles", tone: "sky" },
  { id: "identify", label: "Identify object", description: "Ask about an object visible in the camera view.", icon: "scan", tone: "violet" },
  { id: "read", label: "Read text", description: "Extract text visible to the camera.", icon: "text", tone: "coral" },
  { id: "find", label: "Find object", description: "Name an object and get help locating it.", icon: "search", tone: "teal" },
];

type AssistActionsProps = {
  onAction: (action: TaskAction) => void;
  onSpeak: (text: string, label: string) => void;
  speakingLabel: string | null;
  disabled?: boolean;
};

export function AssistActions({ onAction, onSpeak, speakingLabel, disabled = false }: AssistActionsProps) {
  return (
    <div className="task-grid">
      {actions.map(({ id, label, description, icon, tone }) => {
        const speakLabel = `Read ${label.toLowerCase()} instructions aloud`;
        return (
          <article className={`task-card task-${tone}`} key={id}>
            <button
              className="task-action"
              type="button"
              onClick={() => onAction(id)}
              aria-describedby={`task-description-${id}`}
              disabled={disabled}
            >
              <span className="task-icon"><Icon name={icon} size={20} /></span>
              <span className="task-title">{label}</span>
            </button>
            <div className="task-guidance">
              <p id={`task-description-${id}`} className="task-description">{description}</p>
              <SpeakerButton text={description} label={speakLabel} onSpeak={onSpeak} speaking={speakingLabel === speakLabel} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
