from __future__ import annotations

# Standard library imports
from collections.abc import Mapping
from typing import Any

# Bokeh imports
from tools.release.system import System


class AbortCalled(Exception):
    pass


class RecordingSystem(System):
    def __init__(
        self,
        outputs: Mapping[str, str] | None = None,
        failures: Mapping[str, tuple[str, ...]] | None = None,
        *,
        dry_run: bool = False,
    ) -> None:
        self.outputs = dict(outputs or {})
        self.failures = dict(failures or {})
        self.dry_run = dry_run
        self.calls: list[tuple[str, dict[str, Any]]] = []
        self.directories: list[tuple[str, str | None]] = []
        self.aborted = False

    def run(self, cmd: str, **kw: Any) -> str:
        self.calls.append((cmd, kw))
        if cmd in self.failures:
            raise RuntimeError(*self.failures[cmd])
        return self.outputs.get(cmd, "")

    def cd(self, new_dir: str) -> None:
        self.directories.append(("cd", new_dir))

    def pushd(self, new_dir: str) -> None:
        self.directories.append(("pushd", new_dir))

    def popd(self) -> None:
        self.directories.append(("popd", None))

    def abort(self) -> None:
        self.aborted = True
        raise AbortCalled

    @property
    def commands(self) -> list[str]:
        return [cmd for cmd, _ in self.calls]
