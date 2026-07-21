from __future__ import annotations

import os
import random
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
import pytest

from bokeh.embed import file_html
from bokeh.layouts import row
from bokeh.models import ColumnDataSource, TabPanel, Tabs
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
    const diagnostics = view.canvas_view.webgl_diagnostics
    const wrapper = view.canvas_view.webgl?.regl_wrapper.diagnostics
    const source = view.model.document.get_model_by_name("cross-browser-source")
    const low_alpha_renderer = renderers.find((renderer) => renderer.model.name == "low-alpha-selection")
    const low_alpha_gl = low_alpha_renderer?.nonselection_glyph.glglyph
    const webgl_canvas = view.canvas_view.webgl?.canvas
    let low_alpha_visible = 0
    for (const buffer of low_alpha_gl?._show_by_type.values() ?? []) {
      for (const show of buffer.get_array())
        low_alpha_visible += show != 0 ? 1 : 0
    }
    const low_alpha_source = view.model.document.get_model_by_name("low-alpha-source")
    const low_alpha_sx = view.frame.x_scale.compute(low_alpha_source.data.x[1])
    const low_alpha_sy = view.frame.y_scale.compute(low_alpha_source.data.y[1])
    const ratio = view.canvas_view.pixel_ratio
    const side = Math.max(1, Math.round(8*ratio))
    const low_alpha_pixels = ctx.getImageData(
      Math.round(ratio*low_alpha_sx - side/2), Math.round(ratio*low_alpha_sy - side/2), side, side,
    ).data
    let faded_pixels = 0
    for (let i = 0; i < low_alpha_pixels.length; i += 4) {
      if (low_alpha_pixels[i] != 255 || low_alpha_pixels[i + 1] != 255 || low_alpha_pixels[i + 2] != 255)
        faded_pixels++
    }
    return {
      ready: true,
      range: [view.model.x_range.start, view.model.x_range.end, view.model.y_range.start, view.model.y_range.end],
      colored,
      glyphs: renderers.map((renderer) => renderer.glyph.has_webgl()),
      source_length: source?.get_length() ?? null,
      diagnostics,
      wrapper_pending: wrapper?.pending.commands ?? null,
      low_alpha: {
        byte: low_alpha_gl?._fill_rgba.get_array()[3] ?? null,
        visible: low_alpha_visible,
        faded_pixels,
      },
      surface: {
        offscreen_supported: typeof OffscreenCanvas != "undefined",
        offscreen: typeof OffscreenCanvas != "undefined" && webgl_canvas instanceof OffscreenCanvas,
      },
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
    low_alpha_source = ColumnDataSource(
        data=dict(x=[-4.5, 4.5], y=[4.5, 4.5], marker=["circle", "circle"]),
        name="low-alpha-source",
    )
    low_alpha = plot.scatter(
        x="x",
        y="y",
        size=30,
        marker="marker",
        fill_color="black",
        fill_alpha=1,
        line_color=None,
        nonselection_alpha=0.001,
        source=low_alpha_source,
    )
    low_alpha.name = "low-alpha-selection"
    low_alpha_source.selected.indices = [0]
    plot.ellipse(
        x=[-3, -1.5, 0, 1.5, 3],
        y=[3, 2.6, 3, 2.6, 3],
        width=[0.8, 1.1, 0.7, 1.2, 0.9],
        height=[0.35, 0.6, 0.9, 0.5, 0.7],
        angle=[0.2, -0.5, 0.8, -0.3, 0.6],
        fill_color="#22c55e",
        fill_alpha=0.65,
    )
    plot.multi_polygons(
        xs=[[[[-4.2, -3.5, -3.1, -3.8]], [[-3.9, -3.7, -3.55]]]],
        ys=[[[[-3.8, -4.2, -3.5, -3.0]], [[-3.65, -3.8, -3.55]]]],
        fill_color="#a855f7",
        fill_alpha=0.7,
        line_color="#6b21a8",
        line_width=2,
    )
    plot.text(
        x=[-3.5 + 0.7 * (i % 11) for i in range(88)],
        y=[-2.8 + 0.35 * (i // 11) for i in range(88)],
        text=[f"atlas-{i % 22}" for i in range(88)],
        text_font_size="11px",
        text_color="#0f172a",
        anchor="center",
    )
    plot.tex(
        x=[-3, 0, 3],
        y=[1.4, 1.2, 1.4],
        text=[r"\frac{1}{x^2}", r"\int_0^\infty e^{-x} dx", r"e^{i\pi}+1=0"],
        text_font_size="18px",
        text_color="#0369a1",
        anchor="center",
        display="inline",
    )
    plot.mathml(
        x=[-2, 0, 2],
        y=[0.8, 0.6, 0.8],
        text=[
            "<math><msup><mi>x</mi><mn>2</mn></msup></math>",
            "<math><mfrac><mn>1</mn><mi>x</mi></mfrac></math>",
            "<math><msqrt><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow></msqrt></math>",
        ],
        text_font_size="18px",
        text_color="#15803d",
        anchor="center",
    )
    image = np.full((12, 12), 0x06B6D4FF, dtype=np.uint32)
    plot.image_rgba(image=[image], x=[3.4], y=[-4.4], dw=[0.8], dh=[0.8])

    html = file_html(plot, INLINE, "WebGL cross-browser smoke")
    path.write_text(html.replace("<head>", f"<head>{_ERROR_PROBE}", 1), encoding="utf-8")
    return path


@pytest.fixture(scope="module")
def webgl_document(tmp_path_factory: pytest.TempPathFactory) -> Path:
    return _document(tmp_path_factory.mktemp("webgl-cross-browser") / "index.html")


_MARKER_LAYOUT_PROBE = """
<script>
(() => {
  const visit = (root, canvases) => {
    for (const element of root.querySelectorAll("*")) {
      if (element instanceof HTMLCanvasElement) {
        const rect = element.getBoundingClientRect()
        if (rect.width != 0 && rect.height != 0) {
          canvases.push({
            rect: rect.toJSON(),
            bitmap: [element.width, element.height],
            css: [getComputedStyle(element).width, getComputedStyle(element).height],
          })
        }
      }
      if (element.shadowRoot != null)
        visit(element.shadowRoot, canvases)
    }
  }

  window.__bokeh_marker_layout_probe = () => {
    const root = Object.values(Bokeh.index)[0]
    if (root == null)
      return null
    const canvases = []
    visit(document, canvases)
    const rect = root.el.getBoundingClientRect()
    return {
      ready: canvases.length == 4 && canvases.every(({rect}) => rect.width > 300 && rect.height > 300),
      root: rect.toJSON(),
      viewport: [window.innerWidth, window.innerHeight],
      pixel_ratio: window.devicePixelRatio,
      canvases,
    }
  }
})()
</script>
"""


def _marker_compare_document(path: Path) -> Path:
    rng = random.Random(2026)
    count = 100
    source = ColumnDataSource(data=dict(
        x=[rng.random() for _ in range(count)],
        y=[rng.random() for _ in range(count)],
        color=[f"#{rng.randrange(0x1000000):06x}" for _ in range(count)],
    ))

    def make_plot(title: str, output_backend: str):
        plot = figure(title=title, width=350, height=350, output_backend=output_backend)
        plot.scatter("x", "y", marker="asterisk", size=12, color="color", source=source)
        return plot

    plots = row(
        make_plot("asterisk", "canvas"),
        make_plot("asterisk SVG", "svg"),
        make_plot("asterisk GL", "webgl"),
    )
    tabs = Tabs(tabs=[TabPanel(child=plots, title="asterisk")])
    html = file_html(tabs, INLINE, "WebGL marker layout")
    path.write_text(html.replace("<head>", f"<head>{_MARKER_LAYOUT_PROBE}", 1), encoding="utf-8")
    return path


@pytest.fixture(scope="module")
def marker_compare_document(tmp_path_factory: pytest.TempPathFactory) -> Path:
    return _marker_compare_document(tmp_path_factory.mktemp("webgl-marker-layout") / "index.html")


def _assert_marker_layout(state: dict[str, Any], screenshot: bytes) -> None:
    assert state["ready"] is True
    pixel_ratio = state["pixel_ratio"]
    for canvas in state["canvases"]:
        width = round(canvas["rect"]["width"])
        height = round(canvas["rect"]["height"])
        assert canvas["css"] == [f"{width}px", f"{height}px"]
        assert canvas["bitmap"] == [round(pixel_ratio*width), round(pixel_ratio*height)]

    image_module = pytest.importorskip("PIL.Image")
    image = image_module.open(BytesIO(screenshot)).convert("RGB")
    viewport_width, viewport_height = state["viewport"]
    scale_x = image.width / viewport_width
    scale_y = image.height / viewport_height
    root = state["root"]
    left = min(image.width, round((root["right"] + 2)*scale_x))
    top = max(0, round(root["top"]*scale_y))
    right = image.width
    bottom = min(image.height, round(root["bottom"]*scale_y))
    assert right > left and bottom > top
    pixels = np.asarray(image.crop((left, top, right, bottom)))
    black = np.all(pixels < 32, axis=2)
    assert np.mean(black) < 0.01


def _assert_initial(state: dict[str, Any]) -> None:
    assert state["diagnostics"]["backend"] in ("webgl1", "webgl2")
    assert state["diagnostics"]["compositor_pending"] == 0
    assert state["wrapper_pending"] == 0
    assert state["colored"] > 10_000
    assert len(state["glyphs"]) >= 8
    assert all(state["glyphs"])
    assert state["source_length"] == 2_500
    assert state["low_alpha"]["byte"] == 1
    assert state["low_alpha"]["visible"] == 1
    assert state["low_alpha"]["faded_pixels"] > 0
    assert not state["surface"]["offscreen_supported"] or state["surface"]["offscreen"]
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
def test_webgl_playwright(webgl_document: Path, marker_compare_document: Path) -> None:
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
        page.wait_for_function("window.__bokeh_webgl_probe?.()?.ready === true")
        page.wait_for_function("window.__bokeh_webgl_probe().diagnostics.compositor_pending === 0")
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
        page.wait_for_function("window.__bokeh_webgl_probe().diagnostics.compositor_pending === 0")
        interacted = page.evaluate("window.__bokeh_webgl_probe()")
        assert interacted["range"] != initial["range"]
        assert interacted["colored"] > 10_000
        assert interacted["source_length"] == 2_501
        assert interacted["diagnostics"]["dirty"] is False
        assert interacted["wrapper_pending"] == 0
        assert interacted["errors"] == []

        page.evaluate("Object.values(Bokeh.index)[0].reset()")
        page.wait_for_function("window.__bokeh_webgl_probe().diagnostics.compositor_pending === 0")
        reset = page.evaluate("window.__bokeh_webgl_probe()")
        assert reset["colored"] > 10_000
        assert reset["errors"] == []
        assert errors == []

        page.set_viewport_size({"width": 1600, "height": 700})
        page.goto(marker_compare_document.as_uri(), wait_until="load")
        page.wait_for_function("window.__bokeh_marker_layout_probe?.()?.ready === true")
        marker_layout = page.evaluate("window.__bokeh_marker_layout_probe()")
        _assert_marker_layout(marker_layout, page.screenshot())
        assert errors == []
        browser.close()


@pytest.mark.skipif(os.environ.get("BOKEH_WEBGL_REAL_SAFARI") != "1", reason="real Safari job not selected")
@pytest.mark.selenium
def test_webgl_safari(webgl_document: Path, marker_compare_document: Path, driver: Any) -> None:
    from selenium.webdriver import ActionChains
    from selenium.webdriver.support.ui import WebDriverWait

    driver.set_window_size(900, 700)
    driver.get(webgl_document.as_uri())
    wait = WebDriverWait(driver, 30)
    wait.until(lambda current: current.execute_script("return window.__bokeh_webgl_probe?.()?.ready === true"))
    wait.until(
        lambda current: current.execute_script(
            "return window.__bokeh_webgl_probe().diagnostics.compositor_pending === 0",
        ),
    )
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
    wait.until(
        lambda current: current.execute_script(
            "return window.__bokeh_webgl_probe().source_length === 2501 && window.__bokeh_webgl_probe().diagnostics.compositor_pending === 0",
        ),
    )
    interacted = driver.execute_script("return window.__bokeh_webgl_probe()")
    assert interacted["range"] != initial["range"]
    assert interacted["colored"] > 10_000
    assert interacted["diagnostics"]["dirty"] is False
    assert interacted["wrapper_pending"] == 0
    assert interacted["errors"] == []

    driver.execute_script("Object.values(Bokeh.index)[0].reset()")
    wait.until(
        lambda current: current.execute_script(
            "return window.__bokeh_webgl_probe().diagnostics.compositor_pending === 0",
        ),
    )
    assert driver.execute_script("return window.__bokeh_webgl_probe().errors") == []

    driver.set_window_size(1600, 700)
    driver.get(marker_compare_document.as_uri())
    wait.until(lambda current: current.execute_script("return window.__bokeh_marker_layout_probe?.()?.ready === true"))
    marker_layout = driver.execute_script("return window.__bokeh_marker_layout_probe()")
    _assert_marker_layout(marker_layout, driver.get_screenshot_as_png())
