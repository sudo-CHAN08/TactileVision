import base64
import io
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import from vision_engine.py
from app.vision_engine import DepthEngine, SpatialAnalyzer
from app.gemini_service import GeminiService

app = FastAPI(title="TactileVision Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines from vision_engine.py
depth_engine = DepthEngine()
spatial_analyzer = SpatialAnalyzer()
gemini_service = GeminiService()

LATEST_FRAME_BYTES: bytes | None = None

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "device": getattr(depth_engine, "device", "unknown"),
        "gemini_active": gemini_service.client is not None
    }

@app.websocket("/ws/spatial-feed")
async def spatial_feed(websocket: WebSocket):
    global LATEST_FRAME_BYTES
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()
            img_bytes = base64.b64decode(data.split(",")[-1])
            LATEST_FRAME_BYTES = img_bytes  # Buffer for on-demand Gemini calls

            # Convert bytes to PIL Image (required by DepthEngine in vision_engine.py)
            pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

            # 1. Infer metric depth map
            depth_result = depth_engine.infer_depth_map(pil_img)

            # 2. Analyze spatial zones (Left, Center, Right)
            analysis_result = spatial_analyzer.analyze(depth_result)

            # 3. Send structured JSON payload back to frontend
            # Convert Pydantic result model to dict/JSON
            if hasattr(analysis_result, "model_dump"):
                payload = analysis_result.model_dump()
            else:
                payload = analysis_result.dict()

            await websocket.send_json(payload)

    except WebSocketDisconnect:
        print("[WS] Client disconnected cleanly.")
    except Exception as e:
        print(f"[WS Error]: {e}")

@app.post("/api/explain")
async def explain_hazard():
    global LATEST_FRAME_BYTES
    if LATEST_FRAME_BYTES is None:
        raise HTTPException(status_code=400, detail="No active camera feed received yet.")

    summary = await gemini_service.identify_obstacle(LATEST_FRAME_BYTES)
    return {"summary": summary}