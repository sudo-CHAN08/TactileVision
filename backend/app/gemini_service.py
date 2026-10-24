import os
from pathlib import Path
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Keep the local secret beside the backend code, regardless of the directory
# from which Uvicorn is launched. Production should inject this variable.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

class GeminiService:
    def __init__(self):
        # Automatically loads GEMINI_API_KEY from environment variables
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
            print("[WARNING] GEMINI_API_KEY is missing. Gemini identification disabled.")

    async def identify_obstacle(self, image_bytes: bytes) -> str:
        """Asynchronously calls Gemini to generate a brief image description."""
        if not self.client:
            return "Gemini service unavailable. API key not configured."

        try:
            prompt = (
                "You are an emergency spatial navigator for a blind user. "
                "Identify the most prominent object in this camera image in under 120 words. "
                "Be direct and mention its position only when clear."
            )

            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    prompt,
                ],
            )
            return response.text.strip() if response.text else "Path blocked by unknown obstacle."

        except Exception as e:
            print(f"[Gemini Error] model={self.model}: {e}")
            return "Unable to identify the object. Check the backend terminal for the Gemini error."
