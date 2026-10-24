# Ivision frontend bug audit

## Fixed in this pass

1. **Camera start could report success after a failed start.** `camera.error` is React state, so it can still contain a previous render's value when the async start call resolves. The status branch now treats `started === false` as failure unconditionally and directs the user to the visible camera error.
2. **Stopping during audio initialization could still start the camera.** `startAssistance()` awaited audio-context initialization before calling `camera.start()`. A stop action during that wait did not prevent the later camera start. An assistance-attempt token is now checked after the await and after camera startup.
3. **Custom feedback could behave like a preset.** Selecting Custom previously flowed through preset logic and enabled speech unexpectedly. Custom is now a persistent selection for the current session; it preserves the existing individual toggles. Choosing a preset clears the custom selection.
4. **Phone-angle permission could resolve after Stop.** An asynchronous device-orientation permission request could attach the sensor listener after the user had stopped assistance. A generation token now invalidates pending permission requests when Stop is pressed.
5. **Invalid confidence values could pass hazard validation.** `NaN` passed the previous lower/upper-bound checks. Hazard parsing now rejects non-finite confidence values as well as values outside 0–1.

## Existing behavior checked by source inspection

- Camera access checks secure context and browser API support.
- Camera streams are stopped on normal Stop and component cleanup.
- Preview startup has a timeout and checks that actual video dimensions are available before marking the preview ready.
- Camera errors have messages for common permission, unavailable-device, busy-device, and playback cases.
- AI tasks and live hazard detection are explicitly marked unavailable until a real backend is connected. Demo alerts are labelled as sample events.
- Accessibility preferences are saved locally with storage failures caught.

## Remaining issues / limitations

1. **AI tasks are not functional yet.** Describe, identify, OCR/read text, find-object, and live hazard detection return an unavailable message because no backend contract or service is configured. Fix: agree on the API/WebSocket schema with the backend teammate, then implement request transport, response validation, cancellation, and reconnect handling.
2. **No automated test suite is configured.** Fix: add tests for camera lifecycle/status transitions, hazard parsing/deduplication, feedback-mode behavior, and voice command mapping; then add a browser smoke test for camera on/off and Settings round-trip.
3. **Build/typecheck could not be rerun in this environment.** `npm ci --ignore-scripts --no-audit --no-fund` timed out, so dependencies were unavailable. Fix locally in the project folder with `npm ci`, then run `npm run typecheck` and `npm run build`.
4. **Device-specific behavior remains unverified.** Real iPhone/Android camera permissions, device-orientation permissions, vibration hardware, speech voices, and screen-reader interactions need physical-device testing.
5. **Phone-angle guidance is approximate.** Device orientation is not a depth sensor and must not be described as obstacle detection or a safety guarantee.

## Local verification steps

From the project directory:

```powershell
npm ci
npm run typecheck
npm run build
npm run dev -- --port 3001
```

Then test: camera allow/deny/retry, camera Stop while permission is pending, settings open/close while preview is active, custom feedback selection, speech repeat/stop, demo alerts, and phone-angle enable/Stop.
