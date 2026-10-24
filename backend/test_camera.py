import asyncio
import cv2
import base64
import json
import websockets

async def test_live_webcam():
    uri = "ws://localhost:8000/ws/spatial-feed"
    cap = cv2.VideoCapture(0)  # Open Mac built-in webcam

    if not cap.isOpened():
        print("❌ Could not open webcam.")
        return

    print("✅ Webcam opened! Connecting to FastAPI WebSocket...")

    async with websockets.connect(uri) as ws:
        print("✅ Connected to /ws/spatial-feed! Press 'q' in the window to exit.\n")

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # 1. Flip horizontally so Left/Right align with physical movement
            frame = cv2.flip(frame, 1)

            # 2. Resize frame to match depth input expectations (336x252)
            small_frame = cv2.resize(frame, (336, 252))
            _, buffer = cv2.imencode('.jpg', small_frame)
            b64_frame = "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

            # 3. Send frame over WebSocket
            await ws.send(b64_frame)

            # 4. Receive telemetry output
            response = await ws.recv()
            telemetry = json.loads(response)

            sectors = telemetry.get("sectors", {})
            clusters = telemetry.get("clusters", [])
            has_hazard = telemetry.get("has_hazard", False)

            # 5. Draw bounding boxes on screen for each detected object cluster
            # Scale coordinates from 336x252 depth size to full display camera size
            scale_x = frame.shape[1] / 336.0
            scale_y = frame.shape[0] / 252.0

            for cluster in clusters:
                x, y, w, h = cluster["bounding_box"]
                x_scaled, y_scaled = int(x * scale_x), int(y * scale_y)
                w_scaled, h_scaled = int(w * scale_x), int(h * scale_y)

                dist = cluster["distance_m"]
                zone = cluster["zone"]

                # Red box for close hazards (<1.2m), Yellow box for warnings
                color = (0, 0, 255) if dist < 1.2 else (0, 255, 255)

                # Draw rectangle and label on live video window
                cv2.rectangle(frame, (x_scaled, y_scaled), (x_scaled + w_scaled, y_scaled + h_scaled), color, 2)
                cv2.putText(
                    frame, 
                    f"[{zone.upper()}] {dist}m", 
                    (x_scaled, max(y_scaled - 10, 20)), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.6, 
                    color, 
                    2
                )

            # Print stats to terminal
            print(f"Hazard: {has_hazard} | Clusters: {len(clusters)} | Left: {sectors.get('left', {}).get('distance_m')}m | Center: {sectors.get('center', {}).get('distance_m')}m | Right: {sectors.get('right', {}).get('distance_m')}m | Latency: {telemetry.get('inference_ms')}ms")

            # Show live window with bounding boxes
            cv2.imshow("TactileVision - Live Bounding Box Cluster Test", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    asyncio.run(test_live_webcam())