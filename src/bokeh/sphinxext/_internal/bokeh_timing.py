# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""Measure and report the major phases of a Sphinx documentation build."""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

from sphinx.util import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass, field
from heapq import nlargest
from time import perf_counter
from typing import Any, NamedTuple

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

_PROFILE_ATTR = "_bokeh_docs_profile"


class _DocumentTiming(NamedTuple):
    duration: float
    docname: str


@dataclass
class _DocsProfile:
    started: float
    read_started: float | None = None
    read_finished: float | None = None
    write_started: float | None = None
    documents: int = 0
    resolve_timings: list[_DocumentTiming] = field(default_factory=list)
    serialize_timings: list[_DocumentTiming] = field(default_factory=list)


def _setup_docs_profile(app: Any) -> None:
    app.connect("builder-inited", _start_docs_profile, priority=999)
    app.connect("env-before-read-docs", _start_docs_read)
    app.connect("env-updated", _finish_docs_read, priority=999)
    app.connect("write-started", _start_docs_write, priority=100)
    app.connect("build-finished", _log_docs_profile, priority=999)


def _start_docs_profile(app: Any) -> None:
    setattr(app, _PROFILE_ATTR, _DocsProfile(started=perf_counter()))


def _start_docs_read(app: Any, env: Any, docnames: list[str]) -> None:
    profile = getattr(app, _PROFILE_ATTR, None)
    if profile is not None:
        profile.read_started = perf_counter()
        profile.documents = len(docnames)


def _finish_docs_read(app: Any, env: Any) -> None:
    profile = getattr(app, _PROFILE_ATTR, None)
    if profile is not None:
        profile.read_finished = perf_counter()


def _start_docs_write(app: Any, builder: Any) -> None:
    profile = getattr(app, _PROFILE_ATTR, None)
    if profile is not None:
        profile.write_started = perf_counter()
        profile.resolve_timings.clear()
        profile.serialize_timings.clear()

        resolve_doctree = builder.env.get_and_resolve_doctree

        def timed_resolve_doctree(docname: str, *args: Any, **kwargs: Any) -> Any:
            started = perf_counter()
            try:
                return resolve_doctree(docname, *args, **kwargs)
            finally:
                profile.resolve_timings.append(_DocumentTiming(
                    duration=perf_counter() - started,
                    docname=docname,
                ))

        builder.env.get_and_resolve_doctree = timed_resolve_doctree

        write_serialized = builder.write_doc_serialized

        def timed_write_serialized(docname: str, *args: Any, **kwargs: Any) -> Any:
            started = perf_counter()
            try:
                return write_serialized(docname, *args, **kwargs)
            finally:
                profile.serialize_timings.append(_DocumentTiming(
                    duration=perf_counter() - started,
                    docname=docname,
                ))

        builder.write_doc_serialized = timed_write_serialized


def _log_docs_profile(app: Any, exception: Exception | None) -> None:
    finished = perf_counter()
    profile = getattr(app, _PROFILE_ATTR, None)
    if (
        profile is not None
        and profile.read_started is not None
        and profile.read_finished is not None
        and profile.write_started is not None
    ):
        read_seconds = profile.read_finished - profile.read_started
        prepare_seconds = profile.write_started - profile.read_finished
        write_seconds = finished - profile.write_started
        total_seconds = finished - profile.started
        log.info(
            f"Bokeh Sphinx timings: read={read_seconds:.3f}s prepare={prepare_seconds:.3f}s "
            f"write={write_seconds:.3f}s total={total_seconds:.3f}s "
            f"documents={profile.documents} workers={app.parallel}",
        )

        resolve_timings = profile.resolve_timings
        log.info(
            f"Bokeh doctree resolution: documents={len(resolve_timings)} "
            f"total={sum(timing.duration for timing in resolve_timings):.3f}s",
        )
        for timing in nlargest(5, resolve_timings, key=lambda timing: timing.duration):
            log.info(f"Bokeh doctree slow: {timing.duration:.3f}s {timing.docname}")

        serialize_timings = profile.serialize_timings
        log.info(
            f"Bokeh search-index serialization: documents={len(serialize_timings)} "
            f"total={sum(timing.duration for timing in serialize_timings):.3f}s",
        )
        for timing in nlargest(5, serialize_timings, key=lambda timing: timing.duration):
            log.info(f"Bokeh search-index slow: {timing.duration:.3f}s {timing.docname}")

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
