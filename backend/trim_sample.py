"""Create a short real-traffic clip for local end-to-end validation."""

from pathlib import Path

import cv2


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    source = cv2.VideoCapture(str(root / "uploads" / "highway-test.mp4"))
    fps = source.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(source.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(source.get(cv2.CAP_PROP_FRAME_HEIGHT))
    target = root / "uploads" / "highway-short.mp4"
    writer = cv2.VideoWriter(str(target), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
    target_frames = int(fps * 10)
    for _ in range(target_frames):
        ok, frame = source.read()
        if not ok:
            break
        writer.write(frame)
    source.release()
    writer.release()
    print(target)
