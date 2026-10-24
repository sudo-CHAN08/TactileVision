import type { HazardEvent } from "@/types/hazard";
import { SpeakerButton } from "@/components/SpeakerButton";

const directionLabels: Record<HazardEvent["direction"], string> = {
  front: "Ahead", "front-left": "Ahead · left", "front-right": "Ahead · right",
  left: "Left", right: "Right", rear: "Behind", unknown: "Direction unknown",
};

export function HazardHud({ event, demoMode, onSpeak, speakingLabel }: { event: HazardEvent | null; demoMode: boolean; onSpeak: (text: string, label: string) => void; speakingLabel: string | null }) {
  if (!event) {
    return (
      <section className="hazard-summary" aria-labelledby="hazard-title">
        <div className="section-heading"><div><p className="eyebrow">SCENE AWARENESS</p><h2 id="hazard-title">Hazard status</h2></div><span className="feed-pill"><i aria-hidden="true" />{demoMode ? "DEMO MODE" : "NO LIVE FEED"}</span></div>
        <p className="no-feed">{demoMode ? "Choose “Send sample alert” in Help to try an example." : "Hazard processing is not connected. A clear scene cannot be confirmed."}</p>
      </section>
    );
  }

  const time = event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Just now";
  return (
    <section className={`hazard-summary hazard-${event.severity}`} aria-labelledby="hazard-title">
      <div className="section-heading"><div><p className="eyebrow">{demoMode ? "DEMO EVENT" : "SCENE AWARENESS"}</p><h2 id="hazard-title">Hazard status</h2></div><span className={`severity-pill severity-${event.severity}`}>{event.severity} alert</span></div>
      <div className="hazard-message"><span className="hazard-mark" aria-hidden="true">!</span><div><strong>{event.hazard}</strong><span>{directionLabels[event.direction]}</span></div></div>
      <div className="hazard-speech"><p>{`${event.severity} alert: ${event.hazard}, ${directionLabels[event.direction]}${event.distance_m === undefined ? "" : `, ${event.distance_m.toFixed(1)} metres away`}.`}</p><SpeakerButton text={`${event.severity} alert: ${event.hazard}, ${directionLabels[event.direction]}${event.distance_m === undefined ? "" : `, ${event.distance_m.toFixed(1)} metres away`}.`} label="Read hazard alert aloud" onSpeak={onSpeak} speaking={speakingLabel === "Read hazard alert aloud"} /></div>
      <dl className="hazard-details">
        <div><dt>Direction</dt><dd>{directionLabels[event.direction]}</dd></div>
        <div><dt>Distance</dt><dd>{event.distance_m === undefined ? "Not available" : `${event.distance_m.toFixed(1)} m`}</dd></div>
        <div><dt>Time</dt><dd>{time}</dd></div>
      </dl>
    </section>
  );
}



