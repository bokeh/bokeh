#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import os
from pathlib import Path

import pytest

from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.core.properties import AnyRef, Dict, List, String
from bokeh.document import Document
from bokeh.model import Model
from bokeh.models import Div, IndexedDataSource
from bokeh.plotting import figure
from tests.support.plugins.managed_server_loop import MSL

playwright = pytest.importorskip("playwright.async_api")

pytestmark = pytest.mark.skipif(
    os.environ.get("BOKEH_SERVER_E2E") != "1",
    reason="requires the nightly Bokeh server E2E job or an explicit local run",
)


async def test_python_indexed_source_renders_and_updates(ManagedServerLoop: MSL) -> None:
    class RecordSource(IndexedDataSource):
        __view_model__ = "RecordSource"
        __implementation__ = str(
            Path(__file__).resolve().parents[3] / "bokehjs/test/unit/models/sources/record_source.ts",
        )
        records = List(Dict(String, AnyRef), default=[])

    def modify_document(document: Document) -> None:
        source = RecordSource(name="records", records=[dict(x=2, y=3), dict(x=7, y=8)])
        command = Div(name="command", text="ready")
        plot = figure(name="plot", width=300, height=300, x_range=(0, 10), y_range=(0, 10), tools="")
        plot.scatter("x", "y", source=source, name="points", size=18, fill_color="red", line_color=None)

        def replace_records(attr: str, old: str, new: str) -> None:
            if new == "replace":
                source.records = [dict(x=4, y=6)]

        def acknowledge_records(attr: str, old: list[dict[str, int]], new: list[dict[str, int]]) -> None:
            if new == [dict(x=6, y=4)]:
                command.text = "client update received"

        command.on_change("text", replace_records)
        source.on_change("records", acknowledge_records)
        document.add_root(plot)
        document.add_root(command)

    try:
        with ManagedServerLoop(Application(FunctionHandler(modify_document)), address="127.0.0.1") as server:
            async with playwright.async_playwright() as manager:
                browser = await manager.chromium.launch()
                page = await browser.new_page()
                errors: list[str] = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                try:
                    response = await page.goto(f"http://localhost:{server.port}/", wait_until="domcontentloaded")
                    assert response is not None and response.ok
                    await page.wait_for_function('''() => {
  const target = document.querySelector('[data-bokeh-document-target], [data-bokeh-root]')
  return target?.bokehMount != null || target?.bokehMountError != null
}''', timeout=30_000)
                    assert await page.evaluate('''() =>
  document.querySelector('[data-bokeh-document-target], [data-bokeh-root]').bokehMountError?.message ?? null
''') is None
                    await page.evaluate('''() =>
  document.querySelector('[data-bokeh-document-target], [data-bokeh-root]').bokehMount.ready
''')

                    async def assert_rendered(xs: list[int], ys: list[int]) -> None:
                        await page.wait_for_function('''([xs, ys]) => {
  const document = globalThis.Bokeh?.documents[0]
  const plot = document?.get_model_by_name("plot")
  const renderer = document?.get_model_by_name("points")
  const plot_view = plot != null ? document.views_manager?.find_one(plot) : null
  const renderer_view = renderer != null ? document.views_manager?.find_one(renderer) : null
  if (plot_view == null || renderer_view == null) {
    return false
  }
  const {glyph} = renderer_view
  if (glyph.x?.length != xs.length || glyph.y?.length != ys.length ||
      !xs.every((x, i) => glyph.x[i] === x && glyph.y[i] === ys[i])) {
    return false
  }
  const layer = plot_view.canvas_view.primary
  return xs.every((_, i) => {
    const sx = Math.floor(glyph.sx[i]*layer.pixel_ratio)
    const sy = Math.floor(glyph.sy[i]*layer.pixel_ratio)
    const [r, g, b, a] = layer.ctx.getImageData(sx, sy, 1, 1).data
    return r === 255 && g === 0 && b === 0 && a === 255
  })
}''', arg=[xs, ys], timeout=30_000)

                    await assert_rendered([2, 7], [3, 8])
                    assert await page.evaluate('''() => {
  const source = Bokeh.documents[0].get_model_by_name("records")
  return source.properties.data == null && source.get_length() === 2 && source.get_record(0).x === 2
}''')

                    await page.evaluate('''() => {
  Bokeh.documents[0].get_model_by_name("command").text = "replace"
}''')
                    await assert_rendered([4], [6])

                    await page.evaluate('''() => {
  Bokeh.documents[0].get_model_by_name("records").records = [{x: 6, y: 4}]
}''')
                    await assert_rendered([6], [4])
                    await page.get_by_text("client update received", exact=True).wait_for(state="visible")

                    await page.evaluate('''() => {
  const source = Bokeh.documents[0].get_model_by_name("records")
  const {dict} = Bokeh.require("core/util/object")
  const record = dict(source.records[0])
  record.set("x", 8)
  record.set("y", 2)
  source.data_changed.emit({fields: ["x", "y"], indices: [0], structural: false})
}''')
                    await assert_rendered([8], [2])
                    assert errors == []
                finally:
                    await browser.close()
    finally:
        Model.clear_extensions()
