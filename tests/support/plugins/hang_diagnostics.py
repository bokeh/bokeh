#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Opt-in CI diagnostics that survive a stalled test or worker termination."""
from __future__ import annotations

# Standard library imports
import faulthandler
import os
from collections.abc import Iterator
from pathlib import Path
from typing import TextIO

# External imports
import pytest

_state = pytest.StashKey[tuple[Path, TextIO]]()


def pytest_sessionstart(session: pytest.Session) -> None:
    directory = os.environ.get("BOKEH_TEST_DIAGNOSTICS_DIR")
    if directory is None:
        return
    root = Path(directory)
    root.mkdir(parents=True, exist_ok=True)
    worker = os.environ.get("PYTEST_XDIST_WORKER", "controller")
    prefix = root / f"{worker}-{os.getpid()}"
    trace = prefix.with_suffix(".stacks.txt").open("w", encoding="utf-8")
    session.config.stash[_state] = (prefix.with_suffix(".current.txt"), trace)
    # Write directly to a file, independently of pytest's output capture and
    # signal-based timeout handling. Include fixture teardown after the last test.
    faulthandler.dump_traceback_later(120, repeat=True, file=trace)


def _record(item: pytest.Item, phase: str) -> None:
    state = item.config.stash.get(_state, None)
    if state is not None:
        state[0].write_text(f"{item.nodeid} ({phase})\n", encoding="utf-8")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_protocol(item: pytest.Item) -> Iterator[None]:
    yield
    _record(item, "finished")


@pytest.hookimpl(tryfirst=True)
def pytest_runtest_setup(item: pytest.Item) -> None:
    _record(item, "setup")


@pytest.hookimpl(tryfirst=True)
def pytest_runtest_call(item: pytest.Item) -> None:
    _record(item, "call")


@pytest.hookimpl(tryfirst=True)
def pytest_runtest_teardown(item: pytest.Item) -> None:
    _record(item, "teardown")


@pytest.hookimpl(hookwrapper=True)
def pytest_sessionfinish(session: pytest.Session) -> Iterator[None]:
    try:
        yield
    finally:
        state = session.config.stash.get(_state, None)
        if state is not None:
            faulthandler.cancel_dump_traceback_later()
            state[1].close()
