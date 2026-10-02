from __future__ import annotations

from dataclasses import dataclass, field


VEHICLE_CLASSES = ("car", "motorcycle", "bus", "truck")


@dataclass
class AnalysisMetrics:
    """Metrics derived from one directional virtual count line."""

    counted_track_ids: set[int] = field(default_factory=set)
    class_counts: dict[str, int] = field(
        default_factory=lambda: {vehicle_class: 0 for vehicle_class in VEHICLE_CLASSES}
    )

    def count(self, track_id: int, class_name: str) -> bool:
        if track_id in self.counted_track_ids:
            return False
        self.counted_track_ids.add(track_id)
        if class_name in self.class_counts:
            self.class_counts[class_name] += 1
        return True

    def as_dict(self, duration_seconds: float) -> dict[str, object]:
        vehicle_count = len(self.counted_track_ids)
        arrival_rate = vehicle_count / duration_seconds * 60 if duration_seconds > 0 else 0.0
        return {
            "vehicle_count": vehicle_count,
            "arrival_rate": round(arrival_rate, 1),
            "duration": round(duration_seconds, 2),
            "class_counts": self.class_counts,
        }
