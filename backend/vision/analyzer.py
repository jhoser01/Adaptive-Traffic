from __future__ import annotations

import uuid
from pathlib import Path
import subprocess

import cv2
import imageio_ffmpeg

from .metrics import AnalysisMetrics, VEHICLE_CLASSES


MODEL_NAME = "yolo11n.pt"
CONFIDENCE_THRESHOLD = 0.35
COUNT_LINE_Y_RATIO = 0.55
VEHICLE_CLASS_IDS = (2, 3, 5, 7)  # COCO: car, motorcycle, bus, truck


class VideoAnalyzer:
    """Offline YOLO + ByteTrack analysis with a directional count line."""

    def __init__(self, model_name: str = MODEL_NAME) -> None:
        # Lazy import keeps /health usable when a model installation is incomplete.
        from ultralytics import YOLO

        self.model = YOLO(model_name)

    def analyze(self, input_path: Path, output_dir: Path, direction: str = "down") -> dict[str, object]:
        capture = cv2.VideoCapture(str(input_path))
        if not capture.isOpened():
            raise ValueError("No fue posible abrir el video cargado.")

        fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if width <= 0 or height <= 0:
            capture.release()
            raise ValueError("El video no contiene fotogramas válidos.")

        output_path = output_dir / f"processed-{uuid.uuid4().hex}.mp4"
        raw_output_path = output_dir / f"raw-{uuid.uuid4().hex}.mp4"
        writer = cv2.VideoWriter(str(raw_output_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
        if not writer.isOpened():
            capture.release()
            raise RuntimeError("No fue posible crear el video procesado.")

        count_line_y = int(height * COUNT_LINE_Y_RATIO)
        previous_centers: dict[int, tuple[int, int]] = {}
        metrics = AnalysisMetrics()

        try:
            while True:
                ok, frame = capture.read()
                if not ok:
                    break

                result = self.model.track(
                    frame,
                    persist=True,
                    tracker="bytetrack.yaml",
                    classes=list(VEHICLE_CLASS_IDS),
                    conf=CONFIDENCE_THRESHOLD,
                    verbose=False,
                )[0]

                cv2.line(frame, (0, count_line_y), (width, count_line_y), (225, 180, 63), 2)
                cv2.putText(frame, "LINEA DE CONTEO", (14, max(24, count_line_y - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (225, 180, 63), 2)

                if result.boxes is not None and result.boxes.id is not None:
                    boxes = result.boxes.xyxy.cpu().tolist()
                    track_ids = result.boxes.id.int().cpu().tolist()
                    classes = result.boxes.cls.int().cpu().tolist()
                    for box, track_id, class_id in zip(boxes, track_ids, classes):
                        x1, y1, x2, y2 = (int(value) for value in box)
                        center = ((x1 + x2) // 2, (y1 + y2) // 2)
                        previous = previous_centers.get(track_id)
                        class_name = self.model.names[class_id]
                        valid_crossing = (
                            previous is not None
                            and ((direction == "down" and previous[1] < count_line_y <= center[1])
                                 or (direction == "up" and previous[1] > count_line_y >= center[1]))
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
        finally:
            capture.release()
            writer.release()

        # OpenCV writes MP4V reliably on Windows but browsers may not decode it.
        # Convert the annotated temporary file to H.264/YUV420p for the React video element.
        try:
            subprocess.run(
                [
                    imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-i", str(raw_output_path),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output_path),
                ],
                check=True,
                capture_output=True,
            )
        finally:
            raw_output_path.unlink(missing_ok=True)

        duration = frame_count / fps if fps > 0 else 0.0
        return {**metrics.as_dict(duration), "processed_path": output_path.name}
