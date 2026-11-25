from __future__ import annotations

import json
import os

import numpy as np
import pytest

from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.document import Document
from bokeh.geometry import line_string, polygon
from bokeh.model import Debounce
from bokeh.models import CustomJS, Div, GeometryDataSource, Range1d
from bokeh.util.callback_manager import OldValueUnavailable
from tests.support.plugins.managed_server_loop import MSL

playwright = pytest.importorskip("playwright.async_api")

pytestmark = pytest.mark.skipif(
    os.environ.get("BOKEH_SERVER_E2E") != "1",
    reason="requires the nightly Bokeh server E2E job or an explicit local run",
)


GEOMETRY_SOURCE_READY = '''() =>
  globalThis.Bokeh?.documents[0]?.get_model_by_name("geometry") != null
'''

PYTHON_RECORD_UPDATES_APPLIED = '''() => {
  const doc = Bokeh.documents[0]
  const source = doc.get_model_by_name("geometry")
  return doc.get_model_by_name("status").text === "python complete" &&
    JSON.stringify(source.geometries[0].coordinates[0]) === "[[0,0,0],[7,8,9],[10,11,12],[0,2,2],[0,0,0]]" &&
    JSON.stringify(Array.from(source.get_record(0).value)) === "[7,8]" &&
    source.get_record(0).reference === doc.get_model_by_name("shared")
}'''

APPLY_CLIENT_RECORD_UPDATES = '''() => {
  const doc = Bokeh.documents[0]
  const source = doc.get_model_by_name("geometry")
  const reference = doc.get_model_by_name("shared")
  const {ndarray} = Bokeh.require("core/util/ndarray")
  const {Slice} = Bokeh.require("core/util/slice")
  const geometry = {
    type: "Polygon", coordinates: ndarray(new Float64Array([
      2, 2, 2, 4, 2, 4, 2, 4, 6, 2, 2, 2,
    ]), {shape: [1, 4, 3]}),
  }
  source.replace({geometries: [geometry], data: {value: ndarray(new Float64Array([10, 11]), {shape: [1, 2]}), reference: [reference]}})
  source.stream({geometries: [geometry], data: {value: ndarray(new Float64Array([12, 13]), {shape: [1, 2]}), reference: [reference]}}, 1)
  source.patch({
    geometry: [
      [[0, 0, new Slice({start: 3, stop: 3})], [[12, 13, 14]]],
      [[0, 0, 3], [14, 15, 16]],
    ],
    value: [[0, [14, 15]]],
    reference: [[0, reference]],
  })
  doc.get_model_by_name("command").text = "verify client"
}'''

APPLY_DEFERRED_GEOMETRY_UPDATES = '''() => {
  const source = Bokeh.documents[0].get_model_by_name("geometry")
  const {Slice} = Bokeh.require("core/util/slice")
  source.geometries = [Bokeh.geometry.line_string([[3, 3, 7], [4, 4, 8]])]
  source.patch({geometry: [[[0, new Slice({start: 2, stop: 2})], [[5, 5, 9]]]]})
  source.stream({geometries: [null], data: {["__proto__"]: [1]}}, 2)
}'''

DEFERRED_GEOMETRY_UPDATES_APPLIED = '''() => {
  const text = Bokeh.documents[0].get_model_by_name("status").text
  const {geometries, values} = JSON.parse(text)
  return geometries.length === 2 && JSON.stringify(geometries[0].coordinates) === "[[3,3,7],[4,4,8],[5,5,9]]" && JSON.stringify(values) === "[0,1]"
}'''

QUEUE_ASSIGNMENT_AND_REQUEST_REPLACEMENT = '''() => {
  const doc = Bokeh.documents[0]
  doc.get_model_by_name("geometry").geometries = [null, null]
  doc.get_model_by_name("command").text = "replace"
}'''

GEOMETRY_REPLACEMENT_APPLIED = '''() => {
  const doc = Bokeh.documents[0]
  return JSON.stringify(doc.get_model_by_name("geometry").geometries) === "[null]" &&
    JSON.stringify(JSON.parse(doc.get_model_by_name("status").text).values) === "[2]"
}'''

FLUSH_GEOMETRY_ASSIGNMENT_AND_VERIFY = '''() => {
  const doc = Bokeh.documents[0]
  doc.request_sync_flush(doc.get_model_by_name("geometry"), "geometries")
  doc.get_model_by_name("command").text = "verify"
}'''


async def test_geometry_record_updates_roundtrip(ManagedServerLoop: MSL) -> None:
    def modify_document(document: Document) -> None:
        geometry = polygon([[[0, 0, 0], [2, 0, 1], [0, 2, 2], [0, 0, 0]]])
        reference = Range1d(name="shared")
        source = GeometryDataSource(geometries=[geometry], data={"value": np.array([[1., 2.]]), "reference": [reference]}, name="geometry")
        command = Div(name="command", text="ready")
        status = Div(name="status", text="ready")
        # Retain the source in the document without depending on a glyph.
        command.js_on_change("text", CustomJS(args={"source": source, "reference": reference}, code="void source"))
        changes = []

        def changed(attr, old, new) -> None:
            assert len(source.geometries) == len(source.data["value"])
            changes.append(old is OldValueUnavailable)

        source.on_change("geometries", changed)
        source.on_change("data", changed)

        def update_source() -> None:
            source.replace({"geometries": [geometry], "data": {"value": np.array([[3., 4.]]), "reference": [reference]}})
            source.stream({"geometries": [geometry], "data": {"value": np.array([[5., 6.]]), "reference": [reference]}}, rollover=np.int64(1))
            source.patch({
                "geometry": [((0, 0, slice(1, 2)), [[7, 8, 9], [10, 11, 12]])],
                "value": [(0, [7., 8.])],
                "reference": [(0, reference)],
            })
            status.text = "python complete"

        def verify_source() -> None:
            assert changes == [False, False, True, True, True, True]*2
            assert source.geometries[0]["coordinates"][0] == [
                [2, 2, 2], [4, 2, 4], [2, 4, 6], [14, 15, 16], [2, 2, 2],
            ]
            np.testing.assert_array_equal(source.data["value"], [[14., 15.]])
            assert source.data["reference"][0] is reference
            status.text = "client complete"

        commands = {"python": update_source, "verify client": verify_source}
        command.on_change("text", lambda attr, old, new: commands[new]())
        document.add_root(command)
        document.add_root(status)

    with ManagedServerLoop(Application(FunctionHandler(modify_document)), address="127.0.0.1") as server:
        async with playwright.async_playwright() as manager:
            browser = await manager.chromium.launch()
            page = await browser.new_page()
            errors = []
            sent = []
            page.on("pageerror", lambda error: errors.append(str(error)))

            def observe_socket(socket) -> None:
                def observe_frame(payload) -> None:
                    try:
                        frame = json.loads(payload)
                    except (UnicodeDecodeError, json.JSONDecodeError):
                        return
                    sent.extend(filter(lambda event: event.get("attr") == "records", frame.get("content", {}).get("events", [])))

                socket.on("framesent", observe_frame)

            page.on("websocket", observe_socket)
            try:
                response = await page.goto(f"http://localhost:{server.port}/", wait_until="domcontentloaded")
                assert response is not None and response.ok
                await page.wait_for_function(GEOMETRY_SOURCE_READY)
                await page.evaluate('Bokeh.documents[0].get_model_by_name("command").text = "python"')
                await page.wait_for_function(PYTHON_RECORD_UPDATES_APPLIED)
                assert sent == []

                await page.evaluate(APPLY_CLIENT_RECORD_UPDATES)
                await page.wait_for_function('Bokeh.documents[0].get_model_by_name("status").text === "client complete"')
                assert [event["kind"] for event in sent] == ["ColumnDataChanged", "ColumnsStreamed", "ColumnsPatched"]
                assert errors == []
            finally:
                await browser.close()


async def test_geometry_updates_with_deferred_assignments(ManagedServerLoop: MSL) -> None:
    def modify_document(document: Document) -> None:
        source = GeometryDataSource(
            geometries=[line_string([[0, 0, 7], [1, 1, 8]])],
            data={"__proto__": [0]}, name="geometry",
        )
        command = Div(name="command", text="ready")
        status = Div(name="status", text=json.dumps({"geometries": source.geometries, "values": source.data["__proto__"]}))
        command.js_on_change("text", CustomJS(args={"source": source}, code="void source"))

        def changed(attr, old, new) -> None:
            assert len(source.geometries) == len(source.data["__proto__"])
            status.text = json.dumps({"geometries": source.geometries, "values": source.data["__proto__"]})

        source.on_change("geometries", changed, policy=Debounce(60_000))

        def replace_source() -> None:
            source.replace({"geometries": [None], "data": {"__proto__": [2]}})

        def verify_source() -> None:
            assert source.geometries == [None]
            assert source.data == {"__proto__": [2]}
            status.text = "verified"

        commands = {"replace": replace_source, "verify": verify_source}
        command.on_change("text", lambda attr, old, new: commands[new]())
        document.add_root(command)
        document.add_root(status)

    with ManagedServerLoop(Application(FunctionHandler(modify_document)), address="127.0.0.1") as server:
        async with playwright.async_playwright() as manager:
            browser = await manager.chromium.launch()
            try:
                page = await browser.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                await page.goto(f"http://localhost:{server.port}/", wait_until="domcontentloaded")
                await page.wait_for_function('globalThis.Bokeh?.documents[0]?.get_model_by_name("geometry") != null')
                await page.evaluate(APPLY_DEFERRED_GEOMETRY_UPDATES)
                await page.wait_for_function(DEFERRED_GEOMETRY_UPDATES_APPLIED)
                await page.evaluate(QUEUE_ASSIGNMENT_AND_REQUEST_REPLACEMENT)
                await page.wait_for_function(GEOMETRY_REPLACEMENT_APPLIED)
                await page.evaluate(FLUSH_GEOMETRY_ASSIGNMENT_AND_VERIFY)
                await page.wait_for_function('Bokeh.documents[0].get_model_by_name("status").text === "verified"')
                assert errors == []
            finally:
                await browser.close()
