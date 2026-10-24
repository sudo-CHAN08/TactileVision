"use client";

import { FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { AssistActions, type TaskAction } from "@/components/AssistActions";
import { CameraPreview } from "@/components/CameraPreview";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { HazardHud } from "@/components/HazardHud";
import { HelpPanel, type FeedbackMode } from "@/components/HelpPanel";
import { Icon } from "@/components/Icon";
import { SpeakerButton } from "@/components/SpeakerButton";
import { SpeechControls } from "@/components/SpeechControls";
import { useCamera } from "@/hooks/useCamera";
import { useCameraAlignment } from "@/hooks/useCameraAlignment";
import { useHazardAlerts } from "@/hooks/useHazardAlerts";
import { useSpatialFeed, type SpatialAnalysis } from "@/hooks/useSpatialFeed";
import { useSpeechOutput } from "@/hooks/useSpeechOutput";
import { localizeAppSpeech, localizeHazardSpeech } from "@/lib/speechText";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";

type View = "dashboard" | "help";
const introduction = "Ivision helps you understand your surroundings using your camera. Describe a scene, identify an object, read text, or find something nearby.";
const apiBaseUrl = () => (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export default function DashboardPage() {
  const camera = useCamera();
  const alignment = useCameraAlignment();
  const [view, setView] = useState<View>("dashboard");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [statusVersion, setStatusVersion] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [customFeedbackSelected, setCustomFeedbackSelected] = useState(false);
  const [audioGuidanceEnabled, setAudioGuidanceEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState("system");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskAction | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const helpHeadingRef = useRef<HTMLHeadingElement>(null);
  const assistanceAttempt = useRef(0);
  const previousView = useRef<View>("dashboard");
  const previousAlignment = useRef("");
  const firstInteraction = useRef(false);
  const pendingButton = useRef<HTMLButtonElement | null>(null);
  const alerts = useHazardAlerts({ audioEnabled, speechEnabled: speechEnabled && camera.state !== "active", vibrationEnabled, speechLanguage });
  const handleSpatialAnalysis = (analysis: SpatialAnalysis) => {
    if (!analysis.primary_threat) return;
    const direction = analysis.primary_threat.zone === "left" ? "front-left" : analysis.primary_threat.zone === "right" ? "front-right" : "front";
    alerts.handleHazardEvent({
      type: "hazard", id: `${analysis.primary_threat.timestamp}-${analysis.primary_threat.zone}`,
      hazard: "Obstacle", direction,
      severity: analysis.primary_threat.severity === "critical" ? "critical" : "high",
      distance_m: analysis.primary_threat.distance_m,
      timestamp: new Date(analysis.primary_threat.timestamp).toISOString(),
    });
  };
  const spatialFeed = useSpatialFeed(camera.videoRef, camera.state, handleSpatialAnalysis);

  function updateStatus(message: string) { setStatus(message); setStatusVersion((version) => version + 1); }
  const spoken = useSpeechOutput(() => {
    const message = "Speech output is unavailable in this browser. You can access this text with your screen reader.";
    setResult(message);
    updateStatus(message);
  }, speechLanguage);
  function speak(text: string, label: string) {
    alerts.cancelSpeech();
    spoken.speak(localizeAppSpeech(text, speechLanguage), label);
  }
  function resultSpeechLabel(message: string) {
    return message.toLowerCase().includes("error") || message.toLowerCase().includes("unavailable")
      ? "Read latest error aloud"
      : "Read latest response aloud";
  }
  function showResult(message: string) {
    setResult(message);
    updateStatus(message);
    if (audioGuidanceEnabled) speak(message, resultSpeechLabel(message));
  }
  function handleFirstInteraction(event: MouseEvent<HTMLDivElement>) {
    if (camera.state === "active") return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("button");
    if (!button || button.disabled) return;
    const label = button.getAttribute("aria-label") || button.innerText.trim() || button.title || "This control";
    const describedBy = button.getAttribute("aria-describedby");
    const description = describedBy
      ? describedBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim()).filter(Boolean).join(" ")
      : "";
    if (pendingButton.current === button) {
      pendingButton.current = null;
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    pendingButton.current = button;
    const guidance = description ? `${label}. ${description}` : `${label}. Select this control again to activate it.`;
    speak(guidance, `Button guidance: ${label}`);
    updateStatus(`${guidance} Select the same button again to activate it.`);
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("ivision-accessibility-preferences");
      if (saved) {
        const parsed = JSON.parse(saved) as { highContrast?: boolean; largeText?: boolean; speechLanguage?: string; audioEnabled?: boolean; speechEnabled?: boolean; vibrationEnabled?: boolean; audioGuidanceEnabled?: boolean };
        setHighContrast(parsed.highContrast === true);
        setLargeText(parsed.largeText === true);
        if (parsed.speechLanguage) setSpeechLanguage(parsed.speechLanguage);
        if (parsed.audioEnabled !== undefined) setAudioEnabled(parsed.audioEnabled);
        if (parsed.speechEnabled !== undefined) setSpeechEnabled(parsed.speechEnabled);
        if (parsed.vibrationEnabled !== undefined) setVibrationEnabled(parsed.vibrationEnabled);
        if (parsed.audioGuidanceEnabled !== undefined) setAudioGuidanceEnabled(parsed.audioGuidanceEnabled);
      }
    } catch { /* Storage can be unavailable in private browsing. */ }
    setPreferencesLoaded(true);
  }, []);
  useEffect(() => {
    if (!preferencesLoaded) return;
    try { window.localStorage.setItem("ivision-accessibility-preferences", JSON.stringify({ highContrast, largeText, speechLanguage, audioEnabled, speechEnabled, vibrationEnabled, audioGuidanceEnabled })); }
    catch { /* Preferences remain usable until reload. */ }
  }, [highContrast, largeText, speechLanguage, audioEnabled, speechEnabled, vibrationEnabled, audioGuidanceEnabled, preferencesLoaded]);
  useEffect(() => {
    if (view !== previousView.current) {
      (view === "help" ? helpHeadingRef : titleRef).current?.focus();
      previousView.current = view;
    }
  }, [view]);
  useEffect(() => {
    if (camera.state === "error" && camera.error) showResult(`Camera error. ${camera.error}`);
    if (camera.state === "waiting") updateStatus("Camera permission granted. Waiting for video frames.");
    if (camera.state === "active") {
      const message = "Camera preview ready. Connecting to hazard detection.";
      updateStatus(message);
    }
  }, [camera.state, camera.error]);
  useEffect(() => {
    if (camera.state === "active" && spatialFeed.error) updateStatus(spatialFeed.error);
  }, [camera.state, spatialFeed.error]);
  useEffect(() => {
    if (camera.state !== "active" || alignment.sensorState !== "ready") return;
    const message = alignment.status === "aligned" ? "Camera angle aligned."
      : alignment.status === "tilted_down" ? "Camera angled down. Raise the phone slightly."
        : "Camera angled up. Lower the phone slightly.";
    const key = alignment.status;
    if (previousAlignment.current === key) return;
    previousAlignment.current = key;
    updateStatus(message);
  }, [alignment.status, alignment.sensorState, alignment.pitch, camera.state]);

  async function startAssistance() {
    const attempt = ++assistanceAttempt.current;
    setResult("");
    updateStatus("Requesting camera permission.");
    if (audioEnabled) await alerts.unlockAudio();
    // The user may stop assistance while the browser is unlocking audio.
    // Do not start the camera after that stop request.
    if (attempt !== assistanceAttempt.current) return;
    const started = await camera.start();
    if (attempt !== assistanceAttempt.current) return;
    if (!started) {
      // camera.error is React state and may still contain the previous render's value.
      // Keep this status truthful; the camera hook exposes the detailed error separately.
      updateStatus("Camera did not start. Check the camera error message and retry.");
      return;
    }
    updateStatus("Camera permission granted. Waiting for video frames.");
  }
  function stopAssistance() {
    assistanceAttempt.current += 1;
    voice.cancel(); camera.stop(); alignment.stop(); previousAlignment.current = ""; alerts.clear(); spoken.stop(); setResult("");
    const message = "Camera off. Assistance stopped."; updateStatus(message); if (audioGuidanceEnabled) speak(message, "Camera status");
  }
  function stopSpokenOutput() {
    spoken.stop();
    alerts.cancelSpeech();
    updateStatus("Spoken output stopped.");
  }
  function repeatLastMessage() {
    const hazardIsNewest = alerts.latest && alerts.latestReceivedAt !== null
      && (!spoken.lastMessage || alerts.latestReceivedAt > spoken.lastMessage.spokenAt);
    if (hazardIsNewest && alerts.latest) {
      speak(localizeHazardSpeech(alerts.latest, speechLanguage), "Repeat last hazard message");
      return;
    }
    if (spoken.lastMessage) {
      speak(spoken.lastMessage.text, "Repeat last spoken message");
      return;
    }
    if (alerts.latest) {
      speak(localizeHazardSpeech(alerts.latest, speechLanguage), "Repeat last hazard message");
      return;
    }
    if (result) {
      speak(result, "Repeat latest response");
      return;
    }
    if (status) {
      speak(status, "Repeat latest status");
      return;
    }
    updateStatus("There is no recent message to repeat.");
  }
  async function requestExplanation(label: string) {
    if (spatialFeed.state !== "connected") {
      updateStatus("The vision service is still connecting. Wait a moment, then try again.");
      return;
    }
    setIsExplaining(true);
    updateStatus(`${label} in progress.`);
    try {
      const response = await fetch(`${apiBaseUrl()}/api/explain`, { method: "POST" });
      const body = await response.json() as { summary?: string; detail?: string };
      if (!response.ok) throw new Error(body.detail || "The vision service could not explain the current scene.");
      showResult(body.summary || "No description was returned for the current scene.");
    } catch (cause) {
      showResult(cause instanceof Error ? `Vision request failed. ${cause.message}` : "Vision request failed. Please try again.");
    } finally { setIsExplaining(false); }
  }
  function runAction(action: TaskAction) {
    if (camera.state !== "active") {
      updateStatus("The camera preview is still starting. Wait for it to be ready, then try again.");
      return;
    }
    setResult("");
    setSelectedTask(action);
    if (action === "find") {
      const message = "Find object selected. Enter the object name in the question field."; updateStatus(message); if (audioGuidanceEnabled && !firstInteraction.current) speak(message, "Find object guidance");
      return;
    }
    const name = action === "describe" ? "Scene description" : action === "identify" ? "Object identification" : "Text reading";
    void requestExplanation(name);
  }
  function submitQuery(event: FormEvent<HTMLFormElement>) {
    if (camera.state !== "active") {
      event.preventDefault();
      updateStatus("The camera preview is still starting. Wait for it to be ready, then try again.");
      return;
    }
    event.preventDefault();
    const request = query.trim();
    if (!request) { updateStatus(selectedTask === "find" ? "Type an object name first." : "Type a question first."); return; }
    void requestExplanation(selectedTask === "find" ? `Looking for ${request}` : "Vision request");
  }
  function handleVoiceCommand(raw: string) {
    const command = raw.toLowerCase().trim().replace(/[.!?]+$/, "");
    if (["turn camera on", "camera on"].includes(command)) void startAssistance();
    else if (["turn camera off", "camera off", "stop assistance"].includes(command)) stopAssistance();
    else if (["describe surroundings", "describe", "identify object", "identify an object", "identify", "read text", "read"].includes(command)) void requestExplanation("Vision request");
    else if (command.startsWith("find ") && command.slice(5).trim()) void requestExplanation(`Looking for ${command.slice(5).trim()}`);
    else if (command === "repeat") repeatLastMessage();
    else if (command === "stop speech") stopSpokenOutput();
    else updateStatus("Command not recognized. Open Help for supported commands.");
  }
  function handleDemoModeChange(enabled: boolean) {
    setDemoMode(enabled); if (!enabled) alerts.clear();
    updateStatus(enabled ? "Demo mode on. Sample alerts are not live detections." : "Demo mode off.");
  }
  function sendDemoAlert() {
    if (!demoMode) return;
    alerts.handleHazardEvent({ type: "hazard", id: `demo-${Date.now()}`, hazard: "Chair", direction: "front-right", severity: "high", timestamp: new Date().toISOString(), distance_m: 1.8 });
    updateStatus("Example alert sent. This is not a live detection.");
  }
  function changeAudioPreference(enabled: boolean) { setCustomFeedbackSelected(true); setAudioEnabled(enabled); if (enabled) void alerts.unlockAudio(); updateStatus(enabled ? "Warning sounds on." : "Warning sounds off."); }
  function changeSpeechPreference(enabled: boolean) { setCustomFeedbackSelected(true); setSpeechEnabled(enabled); if (!enabled) { spoken.stop(); alerts.cancelSpeech(); } updateStatus(enabled ? "Spoken hazard announcements on." : "Spoken hazard announcements off."); }
  function changeGuidancePreference(enabled: boolean) { setAudioGuidanceEnabled(enabled); if (!enabled) spoken.stop(); updateStatus(enabled ? "App spoken guidance on." : "App spoken guidance off."); }
  function changeVibrationPreference(enabled: boolean) {
    setCustomFeedbackSelected(true);
    if (enabled && typeof navigator.vibrate !== "function") {
      updateStatus("Vibration is not supported in this browser. Choose speech, beeps, or screen-reader feedback instead.");
      return;
    }
    if (!enabled && typeof navigator.vibrate === "function") navigator.vibrate(0);
    setVibrationEnabled(enabled);
    updateStatus(enabled ? "Vibration alerts on." : "Vibration alerts off.");
  }
  function changeFeedbackMode(mode: FeedbackMode) {
    // Custom is a label for the individual toggles below, not a preset.
    if (mode === "custom") {
      setCustomFeedbackSelected(true);
      updateStatus("Custom feedback selected. Adjust each output using the individual controls.");
      return;
    }
    setCustomFeedbackSelected(false);
    const useVibration = mode === "vibration" || mode === "all";
    if (useVibration && typeof navigator.vibrate !== "function") {
      updateStatus("Vibration is not supported in this browser. Choose another feedback mode.");
      return;
    }
    const useAudio = mode === "audio" || mode === "all";
    const useSpeech = mode !== "screen-reader";
    if (!useVibration && typeof navigator.vibrate === "function") navigator.vibrate(0);
    setAudioEnabled(useAudio);
    setSpeechEnabled(useSpeech);
    setVibrationEnabled(useVibration);
    if (useAudio) void alerts.unlockAudio();
    updateStatus(`Alert feedback set to ${mode.replaceAll("-", " ")}.`);
  }
  function testVibration() {
    if (typeof navigator.vibrate !== "function") {
      updateStatus("Vibration is not supported in this browser. Use speech, beeps, or screen-reader feedback.");
      return;
    }
    const started = navigator.vibrate([100, 70, 100]);
    updateStatus(started ? "Vibration test requested." : "This device did not start vibration. Choose another feedback option.");
  }
  const voice = useVoiceCommands(handleVoiceCommand, updateStatus);
  const active = camera.state === "waiting" || camera.state === "active";
  const feedbackMode: FeedbackMode = customFeedbackSelected ? "custom"
    : !audioEnabled && !speechEnabled && !vibrationEnabled ? "screen-reader"
    : speechEnabled && !audioEnabled && !vibrationEnabled ? "speech"
      : speechEnabled && audioEnabled && !vibrationEnabled ? "audio"
        : speechEnabled && !audioEnabled && vibrationEnabled ? "vibration"
          : speechEnabled && audioEnabled && vibrationEnabled ? "all" : "custom";

  return <div className={`app-shell camera-first${highContrast ? " high-contrast" : ""}${largeText ? " large-text" : ""}`} onClickCapture={handleFirstInteraction}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="app-header">
      <a className="wordmark" href="#main-content" aria-label="Ivision home"><span className="brand-symbol"><Icon name="target" size={21} /></span><span>Ivision</span></a>
      <div className="header-actions">
        <ConnectionStatus cameraState={camera.state} spatialState={spatialFeed.state} />
        <button className="help-link preferences-link" type="button" onClick={() => setView((current) => current === "dashboard" ? "help" : "dashboard")} aria-label={view === "dashboard" ? "Open settings and audio preferences" : "Close settings and return to camera"}><Icon name={view === "dashboard" ? "sound" : "close"} size={19} /><span>{view === "dashboard" ? "Settings" : "Close"}</span></button>
      </div>
    </header>

    {(spoken.lastMessage || alerts.latest || result || status || alerts.isSpeaking) && <SpeechControls hasMessage={Boolean(spoken.lastMessage || alerts.latest || result || status)} speaking={Boolean(spoken.speakingLabel || alerts.isSpeaking)} onRepeat={repeatLastMessage} onStop={stopSpokenOutput} />}
    <p key={statusVersion} className="sr-only" role="status" aria-live="polite" aria-atomic="true">{status}</p>
    <p className="sr-only" role={speechEnabled ? undefined : alerts.latest?.severity === "high" || alerts.latest?.severity === "critical" ? "alert" : "status"} aria-live={speechEnabled ? "off" : alerts.latest?.severity === "high" || alerts.latest?.severity === "critical" ? "assertive" : "polite"} aria-atomic="true">{alerts.message}</p>

    <main id="main-content" className="main-content">
      {view === "dashboard" ? !active ? <section className="camera-off" aria-labelledby="page-title">
        <div className="off-intro"><h1 id="page-title" ref={titleRef} tabIndex={-1}>Camera assistance</h1><div className="intro-copy-row"><p className="intro-copy">{introduction}</p><SpeakerButton text={introduction} label="Listen to introduction" onSpeak={speak} speaking={spoken.speakingLabel === "Listen to introduction"} /></div></div>
        <div className="off-camera-action"><p className={`hero-status ${camera.state === "error" ? "error-copy" : ""}`}><span className={`status-dot ${camera.state === "error" ? "status-dot-error" : ""}`} aria-hidden="true" />{camera.state === "requesting" ? "Requesting camera permission" : camera.state === "error" ? "Camera unavailable" : "Camera off"}</p>
          <button className="start-button" type="button" onClick={() => void startAssistance()} disabled={camera.state === "requesting"}><Icon name="camera" size={22} />{camera.state === "requesting" ? "Requesting permission…" : camera.state === "error" ? "Retry camera" : "Turn camera on"}</button>
          {result && <div className="result-panel error-result"><p>{result}</p><SpeakerButton text={result} label={resultSpeechLabel(result)} onSpeak={speak} speaking={spoken.speakingLabel === resultSpeechLabel(result)} /></div>}
          {alerts.latest && <HazardHud event={alerts.latest} demoMode={demoMode} onSpeak={speak} speakingLabel={spoken.speakingLabel} />}
          <div className="service-note-row"><p className="service-note">Turn on the camera to connect to live hazard detection and scene explanation.</p><SpeakerButton text="Turn on the camera to connect to live hazard detection and scene explanation." label="Read service status aloud" onSpeak={speak} speaking={spoken.speakingLabel === "Read service status aloud"} /></div>
        </div>
        <section className="tasks-section off-tasks" aria-labelledby="quick-actions-title">
          <div className="section-heading-row"><div><h2 id="quick-actions-title">Quick actions</h2><p>Choose what you want Ivision to help with. Turn on the camera first.</p></div><SpeakerButton text="Quick actions. Choose describe scene, identify object, read text, or find object. Turn on the camera first. These AI features require the vision service to be connected." label="Read quick actions aloud" onSpeak={speak} speaking={spoken.speakingLabel === "Read quick actions aloud"} /></div>
          <AssistActions onAction={runAction} onSpeak={speak} speakingLabel={spoken.speakingLabel} />
          <div className="offline-info"><span className="offline-info-mark" aria-hidden="true"><Icon name="help" size={18} /></span><p><strong>AI assistance starts with the camera.</strong> Turn it on to connect to the local vision service and begin live obstacle analysis.</p></div>
        </section>
      </section> : <section className="camera-workspace" aria-label="Camera assistance workspace">
        <div className="workspace-header"><div><h1 id="page-title" ref={titleRef} tabIndex={-1}>Ivision</h1><div className="active-status-row"><p className="active-status"><span className={`status-dot ${spatialFeed.state === "connected" ? "status-dot-on" : ""}`} aria-hidden="true" />{camera.state === "active" ? "Camera preview ready" : "Starting camera preview"} · {spatialFeed.state === "connected" ? "Hazard detection live" : "Connecting vision service"}</p><SpeakerButton text={`Camera preview ${camera.state === "active" ? "ready" : "starting"}. ${spatialFeed.state === "connected" ? "Hazard detection live." : "Connecting vision service."}`} label="Read camera and hazard status aloud" onSpeak={speak} speaking={spoken.speakingLabel === "Read camera and hazard status aloud"} /></div></div><button className="stop-button" type="button" onClick={stopAssistance} aria-label="Stop camera and assistance"><Icon name="close" size={19} />Stop camera</button></div>
        <div className="alignment-control">
          <p role="status" aria-live="polite">{alignment.sensorState === "ready" ? alignment.status === "aligned" ? "Phone angle aligned" : alignment.status === "tilted_down" ? "Phone angle tilted down" : "Phone angle tilted up" : alignment.sensorState === "denied" ? "Phone angle permission denied" : alignment.sensorState === "unsupported" ? "Phone angle guidance unavailable on this device" : alignment.sensorState === "waiting" ? "Waiting for phone angle sensor" : "Optional phone angle guidance is off"}</p>
          {alignment.sensorState !== "ready" && alignment.sensorState !== "waiting" && <button className="alignment-button" type="button" onClick={() => void alignment.requestAccess()}>{alignment.sensorState === "denied" ? "Try phone angle access again" : "Enable phone angle guidance"}</button>}
        </div>
        <CameraPreview videoRef={camera.videoRef} state={camera.state} attachPreview={camera.attachPreview} />
        <form className="ai-input" onSubmit={submitQuery}><label htmlFor="ai-request">{selectedTask === "find" ? "Object to find" : "Ask Ivision about what the camera sees"}</label><div className="ai-input-row"><input id="ai-request" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask Ivision about what the camera sees…" disabled={camera.state !== "active" || isExplaining} /><button className="search-submit" type="submit" disabled={camera.state !== "active" || isExplaining}>{isExplaining ? "Asking…" : "Ask"}</button></div></form>
        <section className="tasks-section active-tasks" aria-label="Camera actions"><AssistActions onAction={runAction} onSpeak={speak} speakingLabel={spoken.speakingLabel} disabled={camera.state !== "active" || isExplaining} /></section>
        {(result || alerts.latest) && <section className="results-area" aria-label="Latest result"><h2>Latest result</h2>{result && <div className="result-panel"><p>{result}</p><SpeakerButton text={result} label={resultSpeechLabel(result)} onSpeak={speak} speaking={spoken.speakingLabel === resultSpeechLabel(result)} /></div>}{alerts.latest && <HazardHud event={alerts.latest} demoMode={demoMode} onSpeak={speak} speakingLabel={spoken.speakingLabel} />}</section>}
      </section> : <HelpPanel headingRef={helpHeadingRef} voiceState={voice.state} demoMode={demoMode} audioEnabled={audioEnabled} speechEnabled={speechEnabled} vibrationEnabled={vibrationEnabled} feedbackMode={feedbackMode} audioGuidanceEnabled={audioGuidanceEnabled} highContrast={highContrast} largeText={largeText} onHighContrastChange={setHighContrast} onLargeTextChange={setLargeText} onBack={() => setView("dashboard")} onStartVoice={voice.start} onCancelVoice={() => { voice.cancel(); updateStatus("Voice command canceled. Microphone off."); }} onDemoModeChange={handleDemoModeChange} onDemoAlert={sendDemoAlert} onSoundChange={changeAudioPreference} onSpeechChange={changeSpeechPreference} onFeedbackModeChange={changeFeedbackMode} onTestVibration={testVibration} onVibrationChange={changeVibrationPreference} onGuidanceChange={changeGuidancePreference} speechLanguage={speechLanguage} onSpeechLanguageChange={(language) => { setSpeechLanguage(language); spoken.stop(); updateStatus("Speech language changed."); }} onRepeat={repeatLastMessage} onStop={stopAssistance} />}
    </main>
  </div>;
}
















