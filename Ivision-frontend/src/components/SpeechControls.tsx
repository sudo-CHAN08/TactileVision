type SpeechControlsProps = {
  hasMessage: boolean;
  speaking: boolean;
  onRepeat: () => void;
  onStop: () => void;
};

export function SpeechControls({ hasMessage, speaking, onRepeat, onStop }: SpeechControlsProps) {
  if (!hasMessage && !speaking) return null;

  return (
    <div className="speech-controls" role="group" aria-label="Speech playback controls">
      <button className="speech-control-button" type="button" onClick={onRepeat} disabled={!hasMessage}>
        Repeat last message
      </button>
      {speaking && (
        <button className="speech-control-button speech-stop-button" type="button" onClick={onStop}>
          Stop speech
        </button>
      )}
    </div>
  );
}
