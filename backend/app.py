from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.vision.analyzer import VideoAnalyzer


BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"
for directory in (UPLOADS_DIR, OUTPUTS_DIR):
    directory.mkdir(exist_ok=True)

app = FastAPI(title="Adaptive Traffic Vision API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")

_analyzer: VideoAnalyzer | None = None


def get_analyzer() -> VideoAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = VideoAnalyzer()
    return _analyzer


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": "yolo11n.pt", "tracker": "ByteTrack"}


@app.post("/analyze")
async def analyze_video(
    file: UploadFile = File(...),
    avenue: str = Form(...),
    direction: str = Form("down"),
) -> dict[str, object]:
    if avenue not in {"A", "B"}:
        raise HTTPException(status_code=422, detail="avenue debe ser A o B")
    if direction not in {"down", "up", "left", "right"}:
        raise HTTPException(status_code=422, detail="direction debe ser down, up, left o right")
    suffix = Path(file.filename or "video.mp4").suffix.lower()
    if suffix not in {".mp4", ".mov", ".avi", ".mkv"}:
        raise HTTPException(status_code=415, detail="Formato de video no admitido")

    upload_path = UPLOADS_DIR / f"{uuid.uuid4().hex}{suffix}"
    try:
        with upload_path.open("wb") as destination:
            shutil.copyfileobj(file.file, destination)
        result = get_analyzer().analyze(upload_path, OUTPUTS_DIR, direction)
        return {**result, "avenue": avenue, "processed_video": f"/outputs/{result['processed_path']}"}
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo analizar el video: {error}") from error
    finally:
        await file.close()
        upload_path.unlink(missing_ok=True)
