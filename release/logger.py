# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""
from __future__ import annotations

# Standard library imports
import re

__all__ = ("LOG", "Log", "Scrubber")


_DEFAULT_REPLACEMENT = "<xxxxx>"

# ref: https://stackoverflow.com/a/14693789
_ANSI_ESCAPE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")


class Scrubber:
    """"""

    def __init__(self, text: str, *, name: str, replacement: str = _DEFAULT_REPLACEMENT) -> None:
        self._text = text
        self._name = name
        self._replacement = replacement

    def __repr__(self) -> str:
        if self._replacement == _DEFAULT_REPLACEMENT:
            return f"Scrubber(..., name={self._name!r})"
        return f"Scrubber(..., name={self._name!r}, replacement={self._replacement!r})"

    def __len__(self) -> int:
        return len(self._text)

    def clean(self, text: str) -> str:
        """"""
        return text.replace(self._text, self._replacement)


class Log:
    """"""

    def __init__(self) -> None:
        self._scrubbers: list[Scrubber] = []
        self._record: list[str] = []

    def add_scrubber(self, scrubber: Scrubber) -> None:
        """"""
        self._scrubbers.append(scrubber)
        self._scrubbers.sort(key=len)

    def record(self, *lines: str) -> tuple[int, int]:
        """"""
        if len(lines) == 1 and "\n" in lines[0]:
            lines = tuple(lines[0].split("\n"))

        start = len(self._record)
        for line in lines:
            line = self._scrub_text(line)
            self._record.append(line)
            print(line, flush=True)
        return (start, len(self._record))

    def clear(self) -> None:
        self._record = []

    def dump(self, *, start: int = 0, end: int | None = None, filter_ansi: bool = True) -> str:
        """"""
        lines = self._record[start:end]

        # scrub outbound for good measure
        full_text = self._scrub_text("\n".join(lines))

        if filter_ansi:
            full_text = _ANSI_ESCAPE.sub("", full_text)

        return full_text

    def _scrub_text(self, text: str) -> str:
        for scrubber in self._scrubbers:
            text = scrubber.clean(text)
        return text


LOG = Log()
