#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import json
import runpy
from collections import deque
from pathlib import Path
from typing import Any

# External imports
import numpy as np
import pytest

# Bokeh imports
from bokeh.document import Document
from bokeh.models import (
    ColumnDataSource,
    Div,
    LinearColorMapper,
    Select,
    Slider,
)
from bokeh.palettes import Inferno256, Turbo256, Viridis256
from bokeh.util.token import get_session_id, get_token_payload


@pytest.fixture
def example() -> dict[str, Any]:
    path = Path(__file__).parents[4] / "examples/server/api/asgi/react_mount.py"
    return runpy.run_path(str(path))


def test_independent_roots_follow_python_callbacks_and_server_ticks(example: dict[str, Any]) -> None:
    doc = Document()
    example["modify_document"](doc)
    controls = doc.select_one({"name": "controls"})
    source = doc.select_one({"name": "source"})
    colormap = doc.select_one({"name": "colormap"})
    color_mapper = doc.select_one({"name": "color_mapper"})
    status = doc.select_one({"name": "status"})
    assert isinstance(controls, Slider)
    assert isinstance(source, ColumnDataSource)
    assert isinstance(colormap, Select)
    assert isinstance(color_mapper, LinearColorMapper)
    assert isinstance(status, Div)
    assert [root.name for root in doc.roots] == ["controls", "plot", "status"]

    roots = list(doc.roots)
    data = source.data
    initial = data["image"][0]
    assert isinstance(initial, np.ndarray)
    assert initial.ndim == 2
    assert colormap.value == "Viridis"
    assert color_mapper.palette == Viridis256
    assert (color_mapper.low, color_mapper.high) == (-10, 10)
    for name, palette in (("Inferno", Inferno256), ("Turbo", Turbo256)):
        colormap.value = name
        assert color_mapper.palette == palette
        assert doc.roots == roots
        assert doc.select_one({"name": "source"}) is source
        assert source.data is data
        assert source.data["image"][0] is initial

    controls.value = 7
    extra = doc.select_one({"name": "extra"})
    assert isinstance(extra, Div)
    assert extra in doc.roots
    assert "amplitude: 7" in status.text
    assert not np.array_equal(source.data["image"][0], initial)

    before_tick = source.data["image"][0].copy()
    doc.session_callbacks[0].callback()
    assert "Server tick: 1" in status.text
    assert "Server tick: 1" in extra.text
    assert not np.array_equal(source.data["image"][0], before_tick)

    controls.value = 2
    assert extra not in doc.roots
    controls.value = 5
    assert doc.select_one({"name": "extra"}) is extra

    other = Document()
    example["modify_document"](other)
    assert [root.name for root in other.roots] == ["controls", "plot", "status"]
    assert other.roots[0] is not controls


async def test_bootstrap_and_bokeh_mount_preserve_host_prefix(example: dict[str, Any]) -> None:
    async def request(path: str) -> list[dict[str, Any]]:
        sent: list[dict[str, Any]] = []

        async def receive() -> dict[str, Any]:
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(event: dict[str, Any]) -> None:
            sent.append(event)

        await example["app"]({
            "type": "http", "method": "GET", "scheme": "http", "http_version": "1.1",
            "path": path, "root_path": "/host", "query_string": b"",
            "headers": [(b"host", b"localhost")],
        }, receive, send)
        return sent

    core = example["bokeh_application"].core
    try:
        first = await request("/host/session")
        second = await request("/host/session")
        first_data = json.loads(first[1]["body"])
        second_data = json.loads(second[1]["body"])
        assert first[0]["status"] == 200
        assert (b"cache-control", b"no-store") in first[0]["headers"]
        assert first_data["url"] == "/host/bkapp/ws"
        assert get_session_id(first_data["token"]) != get_session_id(second_data["token"])
        assert "session_expiry" in get_token_payload(first_data["token"])

        metadata = await request("/host/bkapp/metadata")
        assert metadata[0]["status"] == 200
        assert core.get_sessions("/") == []
    finally:
        await core.stop()


async def test_host_forwards_bokeh_lifespan(example: dict[str, Any]) -> None:
    pending = deque([{"type": "lifespan.startup"}, {"type": "lifespan.shutdown"}])
    sent: list[dict[str, Any]] = []

    async def receive() -> dict[str, Any]:
        return pending.popleft()

    async def send(event: dict[str, Any]) -> None:
        sent.append(event)

    await example["app"]({"type": "lifespan"}, receive, send)
    assert [event["type"] for event in sent] == ["lifespan.startup.complete", "lifespan.shutdown.complete"]
