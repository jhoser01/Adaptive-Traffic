from __future__ import annotations

import uuid
from pathlib import Path
import subprocess
import time

import cv2
import imageio_ffmpeg
import torch

from .metrics import AnalysisMetrics, VEHICLE_CLASSES


MODEL_NAME = "yolo11n.pt"
MAX_ANALYSIS_SECONDS = 60
MAX_OUTPUT_WIDTH = 1280
MAX_OUTPUT_HEIGHT = 720
INFERENCE_SIZE = 640
CONFIDENCE_THRESHOLD = 0.35
COUNT_LINE_Y_RATIO = 0.55
VEHICLE_CLASS_IDS = (2, 3, 5, 7)  # COCO: car, motorcycle, bus, truck


class VideoAnalyzer:
    """Offline YOLO + ByteTrack analysis with a directional count line."""

    def __init__(self, model_name: str = MODEL_NAME) -> None:
        # Lazy import keeps /health usable when a model installation is incomplete.
        from ultralytics import YOLO

        preferred_path = Path(__file__).resolve().parents[1] / "models" / model_name
        self.model_path = preferred_path if preferred_path.exists() else Path(model_name)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[Vision] device: {'CUDA' if self.device == 'cuda' else 'CPU'}")
        print(f"[Vision] model: {self.model_path.resolve() if self.model_path.exists() else self.model_path} (fallback/download if absent)", flush=True)
        self.model = YOLO(str(self.model_path))

    def _reset_tracker(self) -> None:
        """Discard Ultralytics' predictor/tracker state while retaining loaded weights.

        ``persist=True`` is intentionally kept for consecutive frames in one
        video. Ultralytics stores ByteTrack state on its predictor, so clearing
        only our local counters would not isolate independent video streams.
        Dropping the predictor makes the next ``track`` call create a fresh
        predictor and tracker, without reloading the YOLO weights held by the
        model instance.
        """
        if getattr(self.model, "predictor", None) is not None:
            self.model.predictor = None
        print("[Vision] tracker reset: new independent video", flush=True)

    def analyze(self, input_path: Path, output_dir: Path, direction: str = "down") -> dict[str, object]:
        if direction not in {"down", "up", "left", "right"}:
            raise ValueError("direction debe ser down, up, left o right")
        self._reset_tracker()
        capture = cv2.VideoCapture(str(input_path))
        if not capture.isOpened():
            raise ValueError("No fue posible abrir el video cargado.")

        fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
        source_frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        source_width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        source_height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if source_width <= 0 or source_height <= 0:
            capture.release()
            raise ValueError("El video no contiene fotogramas válidos.")

        max_frames = min(source_frame_count, int(fps * MAX_ANALYSIS_SECONDS)) if source_frame_count else int(fps * MAX_ANALYSIS_SECONDS)
        scale = min(1.0, MAX_OUTPUT_WIDTH / source_width, MAX_OUTPUT_HEIGHT / source_height)
        width = max(2, int(source_width * scale))
        height = max(2, int(source_height * scale))
        print(f"[Vision] video: {input_path.name}")
        print(f"[Vision] fps: {fps:.2f}")
        print(f"[Vision] frames: {max_frames} / {source_frame_count}")
        print(f"[Vision] resolution: {source_width}x{source_height} -> {width}x{height}")
        print(f"[Vision] duration: {min(source_frame_count / fps if fps else 0, MAX_ANALYSIS_SECONDS):.2f}s (limit {MAX_ANALYSIS_SECONDS}s)", flush=True)

        output_path = output_dir / f"processed-{uuid.uuid4().hex}.mp4"
        raw_output_path = output_dir / f"raw-{uuid.uuid4().hex}.mp4"
        writer = cv2.VideoWriter(str(raw_output_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
        if not writer.isOpened():
            capture.release()
            raise RuntimeError("No fue posible crear el video procesado.")

        count_line = int(height * COUNT_LINE_Y_RATIO) if direction in {"down", "up"} else int(width * COUNT_LINE_Y_RATIO)
        previous_centers: dict[int, tuple[int, int]] = {}
        metrics = AnalysisMetrics()
        processed_frames = 0
        total_detections = 0
        analysis_started = time.perf_counter()

        try:
            while processed_frames < max_frames:
                ok, frame = capture.read()
                if not ok:
                    break
                if scale < 1.0:
                    frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)
                processed_frames += 1

                result = self.model.track(
                    frame,
                    persist=True,
                    tracker="bytetrack.yaml",
                    classes=list(VEHICLE_CLASS_IDS),
                    conf=CONFIDENCE_THRESHOLD,
                    imgsz=INFERENCE_SIZE,
                    device=self.device,
                    verbose=False,
                )[0]

                if direction in {"down", "up"}:
                    cv2.line(frame, (0, count_line), (width, count_line), (225, 180, 63), 2)
                    cv2.putText(frame, "LINEA DE CONTEO", (14, max(24, count_line - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (225, 180, 63), 2)
                else:
                    cv2.line(frame, (count_line, 0), (count_line, height), (225, 180, 63), 2)
                    cv2.putText(frame, "LINEA DE CONTEO", (count_line + 10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (225, 180, 63), 2)

                if result.boxes is not None and result.boxes.id is not None:
                    boxes = result.boxes.xyxy.cpu().tolist()
                    track_ids = result.boxes.id.int().cpu().tolist()
                    classes = result.boxes.cls.int().cpu().tolist()
                    total_detections += len(track_ids)
                    for box, track_id, class_id in zip(boxes, track_ids, classes):
                        x1, y1, x2, y2 = (int(value) for value in box)
                        center = ((x1 + x2) // 2, (y1 + y2) // 2)
                        previous = previous_centers.get(track_id)
                        class_name = self.model.names[class_id]
                        valid_crossing = previous is not None and (
                            (direction == "down" and previous[1] < count_line <= center[1])
                            or (direction == "up" and previous[1] > count_line >= center[1])
                            or (direction == "right" and previous[0] < count_line <= center[0])
                            or (direction == "left" and previous[0] > count_line >= center[0])
                        )
                        if valid_crossing:
                            metrics.count(track_id, class_name)
                        previous_centers[track_id] = center

                        color = (80, 205, 115) if track_id in metrics.counted_track_ids else (232, 130, 77)
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                        cv2.circle(frame, center, 3, color, -1)
                        cv2.putText(frame, f"{class_name} #{track_id}", (x1, max(22, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

                cv2.putText(frame, f"Vehiculos: {len(metrics.counted_track_ids)}", (14, height - 18), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (242, 246, 247), 2)
                writer.write(frame)
                if processed_frames % 30 == 0 or processed_frames == max_frames:
                    percent = processed_frames / max_frames * 100 if max_frames else 100
                    print(f"[Vision {input_path.stem}] {processed_frames} / {max_frames} frames ({percent:.1f}%) | detections: {total_detections} | IDs: {len(previous_centers)} | cruces: {len(metrics.counted_track_ids)}", flush=True)
        finally:
            capture.release()
            writer.release()

        # OpenCV writes MP4V reliably on Windows but browsers may not decode it.
        # Convert the annotated temporary file to H.264/YUV420p for the React video element.
        try:
            subprocess.run(
                [
                    imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-i", str(raw_output_path),
                    "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output_path),
                ],
                check=True,
                capture_output=True,
            )
        finally:
            raw_output_path.unlink(missing_ok=True)

        duration = processed_frames / fps if fps > 0 else 0.0
        elapsed = time.perf_counter() - analysis_started
        result = {**metrics.as_dict(duration), "processed_path": output_path.name, "processed_frames": processed_frames, "total_detections": total_detections, "processing_seconds": round(elapsed, 2), "device": self.device, "model_path": str(self.model_path)}
        print(f"[Vision {input_path.stem}] vehicle_count: {result['vehicle_count']} | arrival_rate: {result['arrival_rate']} veh/min | processing: {elapsed:.2f}s", flush=True)
        return result
