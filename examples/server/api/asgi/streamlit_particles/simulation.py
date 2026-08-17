from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any, cast

import numpy as np
from streamlit_particles.modes import MODES
from streamlit_particles.state import Snapshot, viewer_states

from bokeh import palettes
from bokeh.document import Document
from bokeh.events import DocumentReady
from bokeh.layouts import column
from bokeh.models import (ColorBar, ColumnDataSource, CustomJS, Div,
                          HoverTool, LinearColorMapper, PointDrawTool)
from bokeh.plotting import figure
from bokeh.transform import transform

if TYPE_CHECKING:
    from bokeh.models.sources import DataDict


GRID_WIDTH = 250
GRID_HEIGHT = 200
POINT_COUNT = GRID_WIDTH * GRID_HEIGHT
JAVASCRIPT_ROOT = Path(__file__).with_name("js")


def read_javascript(name: str) -> str:
    return (JAVASCRIPT_ROOT / name).read_text()


def kernel_code(mode: str) -> str:
    return f"{read_javascript('helpers.js')}\n{read_javascript(f'{mode}.js')}"


def center_data(mode: str) -> DataDict:
    if mode == "fountain":
        return {
            "x": [-1.75, -0.05],
            "y": [-1.45, 0.25],
            "color": ["#fb7185", "#38bdf8"],
        }
    return {
        "x": [-1.15, 1.15],
        "y": [0, 0],
        "color": ["#fb7185", "#38bdf8"],
    }


def particle_data(state: Snapshot, center_values: DataDict) -> DataDict:
    rng = np.random.default_rng(42)

    if state.mode == "fountain":
        emitter_x = float(center_values["x"][0])
        emitter_y = float(center_values["y"][0])
        x = (emitter_x + 0.035*(rng.random(POINT_COUNT) - 0.5)).astype(np.float32)
        y = (emitter_y + 0.025*rng.random(POINT_COUNT)).astype(np.float32)
        vx = (0.52 + 0.15*state.strength + 0.22*(rng.random(POINT_COUNT) - 0.5)).astype(np.float32)
        vy = (0.96 + 0.25*state.strength + 0.22*rng.random(POINT_COUNT)).astype(np.float32)
        life = (3.8*rng.random(POINT_COUNT)).astype(np.float32)
        gravity = 0.34 + 0.14*state.rate
        x = (x + vx*life).astype(np.float32)
        y = (y + vy*life - 0.5*gravity*life*life).astype(np.float32)
        vy = (vy - gravity*life).astype(np.float32)
        speed = np.clip(np.hypot(vx, vy)/2.2, 0, 1).astype(np.float32)
        return {"x": x, "y": y, "vx": vx, "vy": vy, "life": life, "speed": speed}

    grid_x, grid_y = np.meshgrid(
        np.linspace(-3, 3, GRID_WIDTH),
        np.linspace(-2, 2, GRID_HEIGHT),
    )
    x = (grid_x.ravel() + rng.uniform(-0.008, 0.008, POINT_COUNT)).astype(np.float32)
    y = (grid_y.ravel() + rng.uniform(-0.008, 0.008, POINT_COUNT)).astype(np.float32)
    zeros = np.zeros(POINT_COUNT, dtype=np.float32)
    vx = zeros.copy()
    vy = zeros.copy()
    if state.mode == "magnetic":
        index = np.arange(POINT_COUNT, dtype=np.float32)
        vx = (0.42 + 0.16*np.sin(index*0.017)).astype(np.float32)
        vy = (0.18*np.cos(index*0.013)).astype(np.float32)

    return {
        "x": x,
        "y": y,
        "vx": vx,
        "vy": vy,
        "life": zeros.copy(),
        "speed": zeros,
    }


def control_data(state: Snapshot) -> DataDict:
    return {
        "strength": [state.strength],
        "rate": [state.rate],
        "paused": [state.paused],
    }


def status_text(state: Snapshot, center_values: DataDict) -> str:
    mode = MODES[state.mode]
    strength_label, rate_label = (label.lower() for label in mode.controls)
    separation = np.hypot(
        center_values["x"][1] - center_values["x"][0],
        center_values["y"][1] - center_values["y"][0],
    )
    return (
        f"<b>{POINT_COUNT:,} particles · {mode.plot_title}</b> · "
        "CustomJS evolution in this browser · Bokeh WebGL rendering · "
        f"viewer revision {state.revision} · {strength_label} {state.strength:.1f} · "
        f"{rate_label} {state.rate:.1f} · {mode.center_label} {separation:.2f}<br>"
        "Click and drag either colored center to reshape the field."
    )


def modify_document(doc: Document) -> None:
    """Build one independent Bokeh document for a browser session."""
    doc.theme = "dark_minimal"
    session_context = cast(Any, doc.session_context)
    arguments = session_context.request.arguments if session_context else {}
    viewer_argument = arguments.get("viewer")
    viewer_id = viewer_argument[-1].decode() if viewer_argument else "standalone-bokeh-session"
    viewer_state = viewer_states.for_viewer(viewer_id)
    initial = viewer_state.read()

    initial_centers = center_data(initial.mode)
    particles = ColumnDataSource(data=particle_data(initial, initial_centers), name="particles")
    centers = ColumnDataSource(data=initial_centers, name="centers")
    controls = ColumnDataSource(data=control_data(initial), name="controls")
    status = Div(
        text=status_text(initial, centers.data),
        name="status",
        styles={
            "background-color": "#0b1020",
            "color": "#e2e8f0",
            "font-family": "system-ui, sans-serif",
            "padding": "8px 12px",
        },
    )

    color_mapper = LinearColorMapper(palette=palettes.Plasma256, low=0, high=1)
    plot = figure(
        height=460,
        sizing_mode="stretch_width",
        output_backend="webgl",
        title=f"{POINT_COUNT:,} particles · {MODES[initial.mode].plot_title}",
        x_axis_label="x position",
        y_axis_label="y position",
        x_range=(-3, 3),
        y_range=(-2, 2),
        tools=[],
        toolbar_location=None,
    )
    plot.scatter(
        "x",
        "y",
        source=particles,
        size=2.4,
        fill_alpha=0.8,
        fill_color=transform("speed", color_mapper),
        line_color=None,
    )
    center_renderer = plot.scatter(
        "x",
        "y",
        source=centers,
        size=18,
        fill_color="color",
        line_color="#f8fafc",
        line_width=2,
        visible=initial.show_centers,
    )
    center_renderer.hover_glyph = center_renderer.glyph.clone(line_width=4)
    center_tool = PointDrawTool(renderers=[cast(Any, center_renderer)], add=False, drag=True)
    center_hover = HoverTool(renderers=[cast(Any, center_renderer)], tooltips=None)
    plot.add_tools(center_tool, center_hover)
    plot.toolbar.active_tap = center_tool
    plot.toolbar.active_drag = center_tool
    plot.toolbar.active_inspect = center_hover

    color_bar = ColorBar(color_mapper=color_mapper, title=MODES[initial.mode].color_title, width=12)
    plot.add_layout(color_bar, "right")
    plot.background_fill_color = "#020617"
    plot.border_fill_color = "#0b1020"
    plot.grid.grid_line_alpha = 0.25

    evolution = CustomJS(
        args={"centers": centers, "particles": particles},
        code=kernel_code(initial.mode),
        name="particle-evolution",
    )
    driver = CustomJS(
        args={"controls": controls, "evolution": evolution, "particles": particles},
        code=read_javascript("driver.js"),
        name="particle-driver",
    )

    last_revision = initial.revision
    last_reset_count = initial.reset_count
    current_state = initial

    def update_presentation(state: Snapshot) -> None:
        mode = MODES[state.mode]
        center_renderer.visible = state.show_centers
        color_bar.title = mode.color_title
        if plot.title is not None:
            plot.title.text = f"{POINT_COUNT:,} particles · {mode.plot_title}"

    def centers_changed(_attr: str, _old: DataDict, new: DataDict) -> None:
        if len(new["x"]) != 2 or len(new["y"]) != 2:
            centers.data = center_data(current_state.mode)
            return
        status.text = status_text(current_state, new)

    def refresh() -> None:
        nonlocal current_state, last_reset_count, last_revision
        current = viewer_state.read()
        if current.revision == last_revision:
            return

        mode_changed = current.mode != current_state.mode
        reset_requested = current.reset_count != last_reset_count
        current_state = current

        if mode_changed:
            evolution.code = kernel_code(current.mode)
        if mode_changed or reset_requested:
            reset_centers = center_data(current.mode)
            centers.data = reset_centers
            particles.data = particle_data(current, reset_centers)

        controls.data = control_data(current)
        update_presentation(current)
        status.text = status_text(current, centers.data)
        last_revision = current.revision
        last_reset_count = current.reset_count

    centers.on_change("data", centers_changed)
    doc.add_root(column(status, plot, sizing_mode="stretch_width"))
    # Keep the non-visual driver in the document so changes to its controls and
    # evolution kernel are synchronized to the browser.
    doc.add_root(driver)
    doc.add_periodic_callback(refresh, 100)
    doc.js_on_event(DocumentReady, driver)
    doc.title = "Streamlit-controlled particle simulation"
