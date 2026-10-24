# Ivision frontend

Accessible, camera-first assistive web app built with Next.js, TypeScript, and Tailwind CSS.

## Run locally

In this folder, run:

```powershell
npm ci
npm run dev -- --port 3001
```

Open `http://localhost:3001`. Camera access requires browser permission and HTTPS or localhost. Choose another port if 3001 is occupied.

Useful checks:

```powershell
npm run typecheck
npm run build
npm run start -- --port 3001
```

## Camera and alignment

- Camera startup requests permission, attaches the real stream, and reports the preview ready only after video playback and nonzero frame dimensions are confirmed. It handles permission denial, unavailable/busy cameras, startup timeout, track termination, retry, stop, and stream cleanup.
- The video element is reattached when returning from Help/settings while the camera is still running.
- Optional device-angle guidance is requested by the user and uses `deviceorientation`; phone angle is approximate and does not establish obstacle distance or safety.
- In-browser verification on `localhost:3002` displayed a real live camera preview, retained it after opening and leaving settings, and returned to Camera off after Stop. A physical phone test has not been performed.

## Audio and language

- Spoken app guidance and hazard wording can use device language, English, Hindi, Bengali, Tamil, or Spanish. Playback depends on matching voices installed in the browser/operating system.
- Common app and hazard phrases are translated locally. Dynamic AI-generated descriptions/object names are not translated because there is no translation service connected.
- Language preference selection and persistence were checked in the browser. Actual speech output, warning beeps, and screen-reader speech coordination were not verified with a real screen reader or audio-device test.

## Backend and AI status

The frontend connects to the FastAPI service in `../backend` after the camera preview is ready. It sends JPEG camera frames to `/ws/spatial-feed`, displays the backend’s live hazard analysis, and calls `/api/explain` for the scene actions. No secret is exposed to the browser.

Start the backend from the repository root in one terminal:

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Then start the frontend in a second terminal. Local development defaults to `http://localhost:8000` and `ws://localhost:8000/ws/spatial-feed`; copy `.env.example` to `.env.local` only when the service is hosted elsewhere. A hosted HTTPS frontend must use a secure `wss://` WebSocket URL.

The current explain endpoint gives a short obstacle summary from the latest streamed frame. The buttons for describing, identifying, reading text, and finding an object all use that same summary endpoint until dedicated task endpoints are added.

The default indoor detection tuning sends warnings at up to 3.5 m and critical alerts under 0.9 m. It checks more of the central camera frame for small objects and streams the next frame shortly after each inference completes. Audio cues use a low pitch for left, a mid pitch for centre, and a high pitch for right; headphones also receive matching left/right stereo placement when supported. These are assistance cues only: tune and test them in the intended environment before relying on them for navigation.

Person 3 needs to confirm:

- WebSocket URL, authentication, start/stop and camera-frame transport.
- Typed hazard and task request/response examples, including exact field names/enums, timestamps, distance units, and how empty results differ from errors.
- Task endpoints for scene description, object identification, OCR/read text, and find-object, including error responses.
- Heartbeat, retry/reconnect, event ordering, duplicate identity, cancellation, and language support/translation behavior.

## Verification performed

- `npm run typecheck` passed on the final source tree.
- `http://localhost:3002/` returned HTTP 200 during final verification.
- Browser camera on/off, actual preview visibility, Settings round-trip while active, language preference persistence, and Stop were exercised.
- A production build passed before the final camera error-handling adjustment. A final rebuild was attempted but Windows returned `EPERM` while creating an alternate Next build directory, so the current final source has not had a successful production build after that adjustment.
- Screen-reader flow with VoiceOver/TalkBack, keyboard-only full task flow, mobile-device camera, denial recovery, actual multilingual speech/beeps, and all real AI/backend tasks remain unverified or unavailable.

The UI does not announce that hazard detection or inference is active unless a real backend confirms it. This prototype is not a safety-certified navigation device.

## Feedback modes and recovery

- Settings offers screen-reader-only, spoken alerts, speech with beeps, speech with vibration, all three, and custom output modes. The screen-reader live alert remains enabled in every mode.
- Severity-specific vibration patterns use the browser Vibration API. Settings includes a short test pattern, and unsupported browsers receive a clear status message. Hardware vibration itself must be checked on a supported phone.
- Repeat last message is available after a message has been spoken or a hazard has arrived. Stop speech cancels both app speech and the hazard speech queue. Repeat and Stop speech commands are also listed for optional voice control.
- The four camera-dependent tasks and question field stay disabled until the preview is ready, with a status message for the waiting state.

## Latest verification

- `npm run typecheck` passed after the feedback controls were added.
- The development server at `http://localhost:3002/` returned HTTP 200.
- Browser accessibility-tree checks showed the Repeat last message and Stop speech controls; Stop speech removed the active playback control, and repeat playback could be started again.
- The feedback mode selector changed to speech + beeps and returned to screen-reader only. The vibration test call was accepted by the browser API; physical device vibration and actual audio playback were not confirmed.
