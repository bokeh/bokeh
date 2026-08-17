from dataclasses import dataclass, replace
from threading import Lock

from streamlit_particles.modes import MODES


@dataclass(frozen=True)
class Snapshot:
    strength: float = 1.4
    rate: float = 1.6
    mode: str = "vortex"
    paused: bool = False
    show_centers: bool = True
    reset_count: int = 0
    revision: int = 0


class ViewerState:
    """Thread-safe state shared by one Streamlit session and one Bokeh session."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._snapshot = Snapshot()

    def read(self) -> Snapshot:
        with self._lock:
            return self._snapshot

    def update(
        self,
        *,
        strength: float,
        rate: float,
        mode: str,
        paused: bool,
        show_centers: bool,
        reset: bool = False,
    ) -> Snapshot:
        if not 0.2 <= strength <= 3.0 or not 0.2 <= rate <= 5.0:
            raise ValueError("control value outside its allowed range")
        if mode not in MODES:
            raise ValueError(f"unknown simulation mode: {mode}")

        with self._lock:
            current = self._snapshot
            self._snapshot = replace(
                current,
                strength=strength,
                rate=rate,
                mode=mode,
                paused=paused,
                show_centers=show_centers,
                reset_count=current.reset_count + int(reset),
                revision=current.revision + 1,
            )
            return self._snapshot


class ViewerRegistry:
    def __init__(self) -> None:
        self._lock = Lock()
        self._states: dict[str, ViewerState] = {}

    def for_viewer(self, viewer_id: str) -> ViewerState:
        if not 0 < len(viewer_id) <= 128:
            raise ValueError("viewer_id must contain between 1 and 128 characters")

        with self._lock:
            if viewer_id not in self._states:
                self._states[viewer_id] = ViewerState()
            return self._states[viewer_id]


viewer_states = ViewerRegistry()
