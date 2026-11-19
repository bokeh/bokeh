#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

import pytest

from bokeh.core.validation import check_integrity
from bokeh.document import Document
from bokeh.models import HoverTool, Plot, PolarAxis, PolarGrid, PolarMapping, Range1d
from bokeh.plotting import figure


def test_polar_requires_radial_limits() -> None:
    with pytest.raises(ValueError, match="radial_range"):
        figure(coordinate_system=PolarMapping())


def test_polar_ranges_and_guides() -> None:
    mapping = PolarMapping(radial_range=Range1d(0, 10))
    plot = figure(coordinate_system=mapping)
    assert plot.x_range is mapping.radial_range
    assert plot.y_range is mapping.angular_range
    assert mapping.angular_range.start == 0
    assert mapping.angular_range.end == 360
    assert mapping.angle_units == "deg"
    assert mapping.zero_direction == "east"
    assert mapping.direction == "anticlock"
    axes = list(plot.select(PolarAxis))
    grids = list(plot.select(PolarGrid))
    assert {axis.dimension for axis in axes} == {"radial", "angular"}
    assert {grid.axis for grid in grids} == set(axes)
    assert not plot.below
    assert not plot.left
    hover = plot.select_one(HoverTool)
    assert hover is not None
    assert hover.tooltips == [("radius", "$x"), ("angle", "$y")]


def test_polar_scatter_and_serialization() -> None:
    mapping = PolarMapping(radial_range=Range1d(0, 10))
    plot = figure(coordinate_system=mapping)
    renderer = plot.scatter(radius=[1, 2], angle=[0, 90], marker_angle=0.5)
    assert renderer.glyph.x == "x"
    assert renderer.glyph.y == "y"
    assert renderer.glyph.angle == 0.5
    assert renderer.data_source.data == dict(x=[1, 2], y=[0, 90])
    document = Document()
    document.add_root(plot)
    restored = Document.from_json(document.to_json())
    new_plot = restored.roots[0]
    assert new_plot.coordinate_system.radial_range is new_plot.x_range
    assert new_plot.coordinate_system.angular_range is new_plot.y_range
    assert len(list(new_plot.select(PolarAxis))) == 2


@pytest.mark.parametrize("kwargs", [dict(x_range=(0, 10)), dict(y_range=(0, 360)), dict(x_axis_type="log")])
def test_polar_rejects_cartesian_options(kwargs) -> None:
    with pytest.raises(ValueError):
        figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)), **kwargs)


def test_polar_rejects_unsupported_glyphs_and_ambiguous_coordinates() -> None:
    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    with pytest.raises(ValueError, match="not supported by PolarMapping"):
        plot.segment([1], [30], [2], [45])
    with pytest.raises(ValueError, match="either radius and angle or x and y"):
        plot.scatter(x=[1], y=[2], radius=[1], angle=[30])


@pytest.mark.parametrize("radial, angular", [((-1, 10), (0, 360)), ((10, 0), (0, 360)), ((0, 10), (0, 400)), ((0, 10), (10, 10))])
def test_polar_validates_invalid_ranges(radial, angular) -> None:
    mapping = PolarMapping(radial_range=Range1d(*radial), angular_range=Range1d(*angular))
    plot = figure(coordinate_system=mapping)
    assert any("PolarMapping" in issue.extra for issue in check_integrity(plot.references()).error)


@pytest.mark.parametrize("tools", [None, "", "pan"])
def test_polar_respects_explicit_tools(tools) -> None:
    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)), tools=tools)
    assert not list(plot.select(HoverTool))


@pytest.mark.parametrize("tool", ["box_zoom", "zoom_in", "zoom_out", "xpan", "ypan", "xwheel_zoom", "ywheel_zoom", "xwheel_pan", "ywheel_pan"])
def test_polar_rejects_unsupported_tools(tool) -> None:
    with pytest.raises(ValueError, match="PolarMapping"):
        figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)), tools=tool)


def test_direct_plot_uses_mapping_ranges() -> None:
    mapping = PolarMapping(radial_range=Range1d(0, 10))
    plot = Plot(coordinate_system=mapping)
    assert plot.x_range is mapping.radial_range
    assert plot.y_range is mapping.angular_range


def test_polar_range_replacement_requires_updating_plot_references() -> None:
    mapping = PolarMapping(radial_range=Range1d(0, 10))
    plot = figure(coordinate_system=mapping)
    mapping.radial_range = Range1d(0, 20)
    assert plot._check_polar_coordinate_system()
    plot.x_range = mapping.radial_range
    assert not plot._check_polar_coordinate_system()


def test_radian_mapping_requires_explicit_angular_limits() -> None:
    mapping = PolarMapping(radial_range=Range1d(0, 10), angle_units="rad")
    assert "Set angular_range explicitly" in check_integrity([mapping]).error[0].extra


@pytest.mark.parametrize("kind", ["graph", "contour", "add_glyph"])
def test_polar_rejects_other_renderer_entry_points(kind) -> None:
    from bokeh.models import Segment

    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    if kind == "graph":
        invoke = lambda: plot.graph(None, None, None)
    elif kind == "contour":
        invoke = lambda: plot.contour(z=[[0, 1], [1, 0]], levels=[0.5])
    else:
        invoke = lambda: plot.add_glyph(Segment())
    with pytest.raises(ValueError, match="not supported by PolarMapping"):
        invoke()


@pytest.mark.parametrize("kind", ["line", "state", "graph", "composite"])
def test_polar_validates_raw_renderer_configuration(kind) -> None:
    from bokeh.models import (
        CompositeRenderer,
        GlyphRenderer,
        GraphRenderer,
        Scatter,
        Segment,
        StaticLayoutProvider,
    )

    mapping = PolarMapping(radial_range=Range1d(0, 10))
    if kind == "graph":
        renderer = GraphRenderer(layout_provider=StaticLayoutProvider())
    else:
        renderer = GlyphRenderer(glyph=Scatter() if kind == "state" else Segment())
        if kind == "state":
            renderer.selection_glyph = Segment()
        if kind == "composite":
            renderer = CompositeRenderer(renderers=[renderer])
    plot = Plot(coordinate_system=mapping, renderers=[renderer])
    problems = plot._check_polar_renderers()
    assert problems
    assert "not supported by PolarMapping" in problems[0].extra


def test_polar_validates_all_tool_configuration_paths() -> None:
    from bokeh.models import BoxZoomTool, Toolbar, ToolProxy

    mapping = PolarMapping(radial_range=Range1d(0, 10))
    raw = Plot(coordinate_system=mapping, toolbar=Toolbar(tools=[BoxZoomTool()]))
    assert "BoxZoomTool is not supported" in raw._check_polar_tools()[0].extra
    plot = figure(coordinate_system=mapping)
    with pytest.raises(ValueError, match="BoxZoomTool is not supported"):
        plot.tools = [BoxZoomTool()]
    for tool in (BoxZoomTool(), ToolProxy(tools=[BoxZoomTool()])):
        plot.toolbar.tools.append(tool)
        assert "BoxZoomTool is not supported" in plot._check_polar_tools()[0].extra
        plot.toolbar.tools.remove(tool)
    assert not plot._check_polar_tools()


@pytest.mark.parametrize("kwargs", [dict(radius=[1]), dict(angle=[90])])
def test_polar_requires_both_keyword_coordinates(kwargs) -> None:
    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    with pytest.raises(ValueError, match="requires radius and angle together"):
        plot.scatter(**kwargs)


def test_polar_rotation_error_explains_marker_angle() -> None:
    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    with pytest.raises(ValueError, match="marker_angle for marker rotation"):
        plot.scatter([1], [90], angle=0.5)
    renderer = plot.scatter([1], [90], marker_angle=0.5)
    assert renderer.glyph.angle == 0.5


def test_polar_default_angular_ticker_and_label_policy() -> None:
    from bokeh.models import AdaptiveTicker

    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    axis = next(axis for axis in plot.select(PolarAxis) if axis.dimension == "angular")
    assert isinstance(axis.ticker, AdaptiveTicker)
    assert axis.ticker.mantissas == [1, 1.5, 3, 4.5]
    assert axis.wrap_labels


def test_polar_rejects_click_pan_tools() -> None:
    from bokeh.models import ClickPanTool

    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    with pytest.raises(ValueError, match="ClickPanTool is not supported"):
        plot.add_tools(ClickPanTool())


@pytest.mark.parametrize("tools", ["hover", ["hover"], ["pan", "hover"], ("hover",)])
def test_polar_hover_defaults_for_string_and_sequence_tools(tools) -> None:
    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)), tools=tools)
    assert plot.select_one(HoverTool).tooltips == [("radius", "$x"), ("angle", "$y")]


def test_polar_rejects_tiles_and_validates_raw_tile_renderers() -> None:
    from bokeh.models import TileRenderer, WMTSTileSource

    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    with pytest.raises(ValueError, match="TileRenderer is not supported"):
        plot.add_tile("CartoDB Positron")
    plot.renderers.append(TileRenderer(tile_source=WMTSTileSource()))
    assert "TileRenderer is not supported" in plot._check_polar_renderers()[0].extra


@pytest.mark.parametrize("dimension", ["x", "y"])
def test_polar_validates_explicit_nonlinear_scales(dimension) -> None:
    from bokeh.models import LogScale

    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)), **{f"{dimension}_scale": LogScale()})
    assert "linear radial scaling only" in plot._check_polar_coordinate_system()[0].extra


@pytest.mark.parametrize("place", ["center", "above", "below", "left", "right"])
def test_polar_validates_renderers_nested_in_layout_panels(place) -> None:
    from bokeh.models import BoxAnnotation, GlyphRenderer, Segment

    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    plot.add_layout(BoxAnnotation(renderers=[GlyphRenderer(glyph=Segment())]), place)
    assert "not supported by PolarMapping" in plot._check_polar_renderers()[0].extra


def test_polar_named_hover_defaults_preserve_explicit_hover_instances() -> None:
    explicit = HoverTool(tooltips=[("custom", "@value")])
    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)), tools=[explicit, "hover"])
    assert explicit.tooltips == [("custom", "@value")]
    named = next(tool for tool in plot.tools if isinstance(tool, HoverTool) and tool is not explicit)
    assert named.tooltips == [("radius", "$x"), ("angle", "$y")]




@pytest.mark.parametrize("method, kwargs", [
    ("line", dict(x=[2, 4], y=[0, 90])),
    ("patch", dict(x=[2, 4, 2], y=[0, 90, 180])),
    ("multi_line", dict(xs=[[2, 4]], ys=[[0, 90]])),
])
def test_polar_rejects_deferred_path_glyphs(method, kwargs) -> None:
    from bokeh.models import GlyphRenderer

    plot = figure(coordinate_system=PolarMapping(radial_range=Range1d(0, 10)))
    with pytest.raises(ValueError, match="not supported by PolarMapping"):
        getattr(plot, method)(**kwargs)
    renderer = getattr(figure(), method)(**kwargs)
    plot.renderers.append(GlyphRenderer(glyph=renderer.glyph))
    assert "not supported by PolarMapping" in plot._check_polar_renderers()[0].extra
