"use client";

import type { RefObject } from "react";
import type { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { Icon } from "@/components/Icon";

type VoiceState = ReturnType<typeof useVoiceCommands>["state"];
export type FeedbackMode = "screen-reader" | "speech" | "audio" | "vibration" | "all" | "custom";

type HelpPanelProps = {
  headingRef: RefObject<HTMLHeadingElement | null>;
  voiceState: VoiceState;
  demoMode: boolean;
  audioEnabled: boolean;
  speechEnabled: boolean;
  vibrationEnabled: boolean;
  feedbackMode: FeedbackMode;
  audioGuidanceEnabled: boolean;
  speechLanguage: string;
  onSpeechLanguageChange: (language: string) => void;
  highContrast: boolean;
  largeText: boolean;
  onHighContrastChange: (enabled: boolean) => void;
  onLargeTextChange: (enabled: boolean) => void;
  onBack: () => void;
  onStartVoice: () => void;
  onCancelVoice: () => void;
  onDemoModeChange: (enabled: boolean) => void;
  onDemoAlert: () => void;
  onSoundChange: (enabled: boolean) => void;
  onSpeechChange: (enabled: boolean) => void;
  onFeedbackModeChange: (mode: FeedbackMode) => void;
  onTestVibration: () => void;
  onVibrationChange: (enabled: boolean) => void;
  onGuidanceChange: (enabled: boolean) => void;
  onRepeat: () => void;
  onStop: () => void;
};

export function HelpPanel({ headingRef, voiceState, demoMode, audioEnabled, speechEnabled, vibrationEnabled, feedbackMode, audioGuidanceEnabled, speechLanguage, onSpeechLanguageChange, highContrast, largeText, onHighContrastChange, onLargeTextChange, onBack, onStartVoice, onCancelVoice, onDemoModeChange, onDemoAlert, onSoundChange, onSpeechChange, onFeedbackModeChange, onTestVibration, onVibrationChange, onGuidanceChange, onRepeat, onStop }: HelpPanelProps) {
  const listening = voiceState === "listening";
  const processing = voiceState === "processing";
  return (
    <section className="help-view" aria-labelledby="help-title">
      <div className="help-heading-row">
        <div><p className="eyebrow">PREFERENCES & SUPPORT</p><h1 id="help-title" ref={headingRef} tabIndex={-1}>Help & settings</h1></div>
        <button className="back-button" type="button" onClick={onBack}><span aria-hidden="true">←</span> Back</button>
      </div>

      <section className="settings-card" aria-labelledby="voice-title">
        <div className="settings-title"><span className="settings-icon"><Icon name="speech" /></span><div><h2 id="voice-title">Optional voice access</h2><p>Use one spoken command at a time.</p></div></div>
        <button className="voice-button" type="button" onClick={listening ? onCancelVoice : onStartVoice} disabled={processing}>
          <Icon name={listening ? "close" : "speech"} size={20} />
          {listening ? "Cancel voice command" : processing ? "Processing command…" : "Start voice command"}
        </button>
        <p className="setting-note">Microphone access is requested only when you start a command. Recognition support depends on your browser.</p>
        {voiceState === "unsupported" && <p className="inline-note">Voice recognition is unavailable here. Every task remains available through buttons and screen-reader navigation.</p>}
        <details className="commands-details"><summary>Supported commands</summary><ul><li>Turn camera on or off</li><li>Describe surroundings</li><li>Identify an object</li><li>Read text</li><li>Find followed by an object name</li><li>Repeat the last spoken message</li><li>Stop speech</li><li>Stop assistance</li></ul></details>
      </section>

      <section className="settings-card" aria-labelledby="guidance-title">
        <div className="settings-title"><span className="settings-icon"><Icon name="sound" /></span><div><h2 id="guidance-title">App spoken guidance</h2><p>On by default. Speaks a short welcome after your first tap and reads important app updates aloud.</p></div></div>
        <label className="preference-row"><span><strong>Spoken guidance</strong><small>Turn off if you use only your screen reader</small></span><input type="checkbox" checked={audioGuidanceEnabled} onChange={(event) => onGuidanceChange(event.target.checked)} /></label>
        <div className="language-setting"><label htmlFor="speech-language">Speech language</label><select id="speech-language" value={speechLanguage} onChange={(event) => onSpeechLanguageChange(event.target.value)}><option value="system">Device language</option><option value="en-US">English</option><option value="hi-IN">Hindi</option><option value="bn-IN">Bengali</option><option value="ta-IN">Tamil</option><option value="es-ES">Spanish</option></select><p>App guidance and hazard wording are translated for English, Hindi, Bengali, Tamil and Spanish. Spoken voice availability depends on your device. AI-generated text and object names stay in the language provided by the service.</p></div>
      </section>

      <section className="settings-card" aria-labelledby="display-title">
        <div className="settings-title"><span className="settings-icon"><Icon name="target" /></span><div><h2 id="display-title">Display access</h2><p>Saved on this device for your next visit.</p></div></div>
        <label className="preference-row"><span><strong>High contrast</strong><small>Increase contrast for low vision</small></span><input type="checkbox" checked={highContrast} onChange={(event) => onHighContrastChange(event.target.checked)} /></label>
        <label className="preference-row"><span><strong>Larger text</strong><small>Increase app text size</small></span><input type="checkbox" checked={largeText} onChange={(event) => onLargeTextChange(event.target.checked)} /></label>
      </section>

      <section className="settings-card" aria-labelledby="alerts-title">
        <div className="settings-title"><span className="settings-icon"><Icon name="sound" /></span><div><h2 id="alerts-title">Alert feedback</h2><p>Choose how app alerts reach you. Screen-reader announcements remain available in every mode.</p></div></div>
        <div className="feedback-mode-setting">
          <label htmlFor="feedback-mode">Feedback mode</label>
          <select id="feedback-mode" value={feedbackMode} onChange={(event) => onFeedbackModeChange(event.target.value as FeedbackMode)}>
            <option value="screen-reader">Screen reader only</option>
            <option value="speech">Spoken alerts</option>
            <option value="audio">Speech and beeps</option>
            <option value="vibration">Speech and vibration</option>
            <option value="all">Speech, beeps and vibration</option>
            <option value="custom">Custom outputs</option>
          </select>
          <p>Vibration patterns differ by alert severity. Browser and device support varies; use Test vibration before relying on it.</p>
        </div>
        <div className="feedback-test-row">
          {vibrationEnabled && <button className="secondary-button" type="button" onClick={onTestVibration}>Test vibration</button>}
        </div>
        <details className="feedback-customize">
          <summary>Customize individual outputs</summary>
          <label className="preference-row"><span><strong>Warning sounds</strong><small>Short beeps for incoming alerts</small></span><input type="checkbox" checked={audioEnabled} onChange={(event) => onSoundChange(event.target.checked)} /></label>
          <label className="preference-row"><span><strong>Spoken hazard announcements</strong><small>Read incoming alerts aloud</small></span><input type="checkbox" checked={speechEnabled} onChange={(event) => onSpeechChange(event.target.checked)} /></label>
          <label className="preference-row"><span><strong>Vibration alerts</strong><small>Short patterns on supported mobile devices</small></span><input type="checkbox" checked={vibrationEnabled} onChange={(event) => onVibrationChange(event.target.checked)} /></label>
        </details>
      </section>

      <section className="settings-card demo-settings" aria-labelledby="demo-title">
        <div className="settings-title"><span className="demo-tag">DEMO</span><div><h2 id="demo-title">Demo mode</h2><p>Try a clearly labelled sample event. No backend connection.</p></div></div>
        <label className="preference-row"><span><strong>Enable demo mode</strong><small>Allows sample hazard events on this device</small></span><input type="checkbox" checked={demoMode} onChange={(event) => onDemoModeChange(event.target.checked)} /></label>
        {demoMode && <button className="sample-button" type="button" onClick={onDemoAlert}>Send sample alert</button>}
      </section>

      <div className="help-controls">
        <button className="secondary-button" type="button" onClick={onRepeat}>Repeat last update</button>
        <button className="stop-button" type="button" onClick={onStop}>Stop assistance</button>
      </div>
    </section>
  );
}




