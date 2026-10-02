"""Run the local highway sample through the same analyzer used by POST /analyze."""

from pathlib import Path

from vision.analyzer import VideoAnalyzer


if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    result = VideoAnalyzer().analyze(root / "uploads" / "highway-short.mp4", root / "outputs", "down")
    print(result)
