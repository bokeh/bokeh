from __future__ import annotations

import os
import random
from pathlib import Path
from typing import Any

import pytest

from bokeh.embed import file_html
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure
from bokeh.resources import INLINE

pytest_plugins = ("tests.support.plugins.selenium",)


_ERROR_PROBE = """
<script>
(() => {
  const errors = window.__bokeh_test_errors = []
  const describe = (value) => {
    try {
      return value instanceof Error ? `${value.name}: ${value.message}` : String(value)
    } catch {
      return "<unprintable>"
    }
  }
  const original_error = console.error.bind(console)
  console.error = (...args) => {
    errors.push(`console: ${args.map(describe).join(" ")}`)
    original_error(...args)
  }
  window.addEventListener("error", (event) => errors.push(`error: ${event.message}`))
  window.addEventListener("unhandledrejection", (event) => errors.push(`rejection: ${describe(event.reason)}`))
  window.addEventListener("webglcontextlost", () => errors.push("webgl context lost"), true)

  window.__bokeh_webgl_probe = () => {
    const roots = Object.values(Bokeh.index)
    if (roots.length == 0 || roots[0].canvas_view == null)
      return null
    const view = roots[0]
    const renderers = view.computed_renderer_views.filter((renderer) => renderer.glyph != null)
    const {canvas, ctx} = view.canvas_view.primary
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let colored = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] != 0 && (pixels[i] < 245 || pixels[i + 1] < 245 || pixels[i + 2] < 245))
        colored++
    }
    const source = view.model.document.get_model_by_name("cross-browser-source")
    return {
      ready: view.canvas_view.webgl != null,
      range: [view.model.x_range.start, view.model.x_range.end, view.model.y_range.start, view.model.y_range.end],
      colored,
      glyphs: renderers.map((renderer) => renderer.glyph.has_webgl()),
      source_length: source?.get_length() ?? null,
      errors: [...errors],
      events: view.canvas_view.events_el.getBoundingClientRect().toJSON(),
    }
  }
})()
</script>
"""


def _document(path: Path) -> Path:
    rng = random.Random(2026)
    count = 2_500
    markers = ["circle", "square", "triangle", "diamond", "hex", "star"]
    source = ColumnDataSource(
        data=dict(
            x=[8 * rng.random() - 4 for _ in range(count)],
            y=[8 * rng.random() - 4 for _ in range(count)],
            size=[5 + i % 7 for i in range(count)],
            marker=[markers[i % len(markers)] for i in range(count)],
            color=["#2563eb" if i % 2 == 0 else "#f97316" for i in range(count)],
            alpha=[0.45 for _ in range(count)],
        ),
        name="cross-browser-source",
    )
    plot = figure(
        width=760,
        height=520,
        x_range=(-5, 5),
        y_range=(-5, 5),
        output_backend="webgl",
        tools="pan,wheel_zoom,reset",
        active_drag="pan",
        active_scroll="wheel_zoom",
        toolbar_location="above",
        background_fill_color="white",
    )
    plot.grid.visible = False
    plot.axis.visible = False
    plot.scatter(
        x="x",
        y="y",
        size="size",
        marker="marker",
        fill_color="color",
        fill_alpha="alpha",
        line_color=None,
        source=source,
    )
    plot.line([-4, -2, 0, 2, 4], [-3, -2, -3, -2, -3], line_width=4, line_color="#16a34a")
    plot.patch([-1.5, 0, 1.5, 0], [1.2, 3.8, 1.2, 2.1], fill_alpha=0.5, fill_color="#7c3aed")

    html = file_html(plot, INLINE, "WebGL cross-browser smoke")
    path.write_text(html.replace("<head>", f"<head>{_ERROR_PROBE}", 1), encoding="utf-8")
    return path


@pytest.fixture(scope="module")
def webgl_document(tmp_path_factory: pytest.TempPathFactory) -> Path:
    return _document(tmp_path_factory.mktemp("webgl-cross-browser") / "index.html")


def _assert_initial(state: dict[str, Any]) -> None:
    assert state["ready"] is True
    assert state["colored"] > 2_000
    assert len(state["glyphs"]) == 3
    assert all(state["glyphs"])
    assert state["source_length"] == 2_500
    assert state["errors"] == []


def _mutation_script() -> str:
    return """
    () => {
      const view = Object.values(Bokeh.index)[0]
      const source = view.model.document.get_model_by_name("cross-browser-source")
      source.patch({x: [[0, 1.25]], y: [[0, -1.5]], marker: [[0, "star"]], alpha: [[0, 0.8]]})
      source.stream({x: [0.5], y: [-0.5], size: [12], marker: ["hex"], color: ["#22c55e"], alpha: [0.7]}, 2_501)
      source.selected.indices = [0, 500, 2_500]
    }
    """


@pytest.mark.skipif(os.environ.get("BOKEH_WEBGL_BROWSER") is None, reason="cross-browser engine not selected")
def test_webgl_playwright(webgl_document: Path) -> None:
    playwright = pytest.importorskip("playwright.sync_api")
    engine = os.environ["BOKEH_WEBGL_BROWSER"]
    errors: list[str] = []
    with playwright.sync_playwright() as manager:
        browser_type = getattr(manager, engine)
        browser = browser_type.launch(headless=True)
        page = browser.new_page(viewport={"width": 900, "height": 700}, device_scale_factor=2)
        page.on("console", lambda message: errors.append(f"console: {message.text}") if message.type == "error" else None)
        page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))
        page.goto(webgl_document.as_uri(), wait_until="load")
        page.wait_for_function("window.__bokeh_webgl_probe?.()?.colored > 2000")
        initial = page.evaluate("window.__bokeh_webgl_probe()")
        _assert_initial(initial)

        events = initial["events"]
        cx = events["x"] + events["width"] / 2
        cy = events["y"] + events["height"] / 2
        page.mouse.move(cx, cy)
        page.mouse.down()
        page.mouse.move(cx + 70, cy + 35, steps=5)
        page.mouse.up()
        page.mouse.wheel(0, -450)
        page.evaluate(_mutation_script())
        page.wait_for_function("window.__bokeh_webgl_probe().source_length === 2501")
        page.wait_for_timeout(100)
        interacted = page.evaluate("window.__bokeh_webgl_probe()")
        assert interacted["range"] != initial["range"]
        assert interacted["colored"] > 2_000
        assert interacted["source_length"] == 2_501
        assert interacted["errors"] == []

        page.evaluate("Object.values(Bokeh.index)[0].reset()")
        page.wait_for_timeout(100)
        reset = page.evaluate("window.__bokeh_webgl_probe()")
        assert reset["colored"] > 2_000
        assert reset["errors"] == []
        assert errors == []
        browser.close()


@pytest.mark.skipif(os.environ.get("BOKEH_WEBGL_REAL_SAFARI") != "1", reason="real Safari job not selected")
@pytest.mark.selenium
def test_webgl_safari(webgl_document: Path, driver: Any) -> None:
    from selenium.webdriver import ActionChains
    from selenium.webdriver.support.ui import WebDriverWait

    driver.set_window_size(900, 700)
    driver.get(webgl_document.as_uri())
    wait = WebDriverWait(driver, 30)
    wait.until(lambda current: current.execute_script("return window.__bokeh_webgl_probe?.()?.colored > 2000"))
    initial = driver.execute_script("return window.__bokeh_webgl_probe()")
    _assert_initial(initial)

    events = driver.execute_script("return Object.values(Bokeh.index)[0].canvas_view.events_el")
    ActionChains(driver).move_to_element(events).click_and_hold().move_by_offset(70, 35).release().perform()
    driver.execute_script("""
      const element = Object.values(Bokeh.index)[0].canvas_view.events_el
      const rect = element.getBoundingClientRect()
      element.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true, cancelable: true, deltaY: -450,
        clientX: rect.x + rect.width/2, clientY: rect.y + rect.height/2,
      }))
    """)
    driver.execute_script(f"return ({_mutation_script()})()")
    wait.until(lambda current: current.execute_script("return window.__bokeh_webgl_probe().source_length === 2501"))
    interacted = driver.execute_script("return window.__bokeh_webgl_probe()")
    assert interacted["range"] != initial["range"]
    assert interacted["colored"] > 2_000
    assert interacted["errors"] == []

    driver.execute_script("Object.values(Bokeh.index)[0].reset()")
    assert driver.execute_script("return window.__bokeh_webgl_probe().errors") == []
