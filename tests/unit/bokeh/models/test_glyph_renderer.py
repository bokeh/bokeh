#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from typing import Any, Literal, cast

import numpy as np
import pytest

from bokeh.core.property.vectorization import field
from bokeh.core.validation.check import ValidationIssue
from bokeh.models import (
    ColorBar,
    ColumnDataSource,
    GeoJSONDataSource,
    Image,
    ImageRGBA,
    ImageStack,
    IndexFilter,
    Line,
    MultiLine,
    NormalHead,
    OpenHead,
    Patch,
    PathPlacement,
    Scatter,
    Segment,
    Text,
    WebDataSource,
    WeightedStackColorMapper,
)
from bokeh.transform import linear_cmap, log_cmap

# Module under test
import bokeh.models.renderers as bmr # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


@pytest.mark.parametrize("node", ["start", "middle", "end"])
def test_add_arrowheads_named(node: Literal["start", "middle", "end"]) -> None:
    renderer = bmr.GlyphRenderer(glyph=Segment())
    path_marking = renderer.add_arrowheads(at=node)
    assert isinstance(path_marking, PathPlacement)
    assert path_marking.positions == node
    assert isinstance(path_marking.marking, OpenHead)
    assert path_marking.marking.inherit_visuals == ["line_color", "line_alpha", "line_width"]
    assert renderer.glyph.path_markings == [path_marking]


@pytest.mark.parametrize("at", ["end", 0.5])
def test_add_arrowheads_forwards_placement_angle(at: Any) -> None:
    renderer = bmr.GlyphRenderer(glyph=MultiLine())
    rotation = field("rotation", units="deg")
    marking = renderer.add_arrowheads(at=at, angle=rotation, angle_reference="left")
    assert marking.angle == rotation
    assert marking.angle_reference == "left"


def test_add_arrowheads_default_and_fractional_end() -> None:
    renderer = bmr.GlyphRenderer(glyph=Segment())
    head = NormalHead(size=12)
    end = renderer.add_arrowheads()
    fractional = renderer.add_arrowheads(at=1.0, head=head)
    repeated = renderer.add_arrowheads(at=(0.25, 0.75))
    assert isinstance(end, PathPlacement)
    assert end.positions == "end"
    assert isinstance(fractional, PathPlacement)
    assert fractional.positions == [1.0]
    assert fractional.marking is head
    assert repeated.positions == [0.25, 0.75]
    assert renderer.glyph.path_markings == [end, fractional, repeated]


@pytest.mark.parametrize("at", [field("positions"), {"field": "positions"}])
def test_add_arrowheads_field(at: Any) -> None:
    source = ColumnDataSource(dict(xs=[[0, 1], [0, 1]], ys=[[0, 0], [1, 1]], positions=[[0.2, 0.8], []]))
    renderer = bmr.GlyphRenderer(glyph=MultiLine(), data_source=source)
    markings = renderer.add_arrowheads(at=at)
    assert isinstance(markings, PathPlacement)
    assert markings.positions == field("positions")
    assert renderer.glyph.path_markings == [markings]


@pytest.mark.parametrize("at", [field(cast(Any, 3)), {"field": 3}, {"field": "positions", "value": [0.5]}])
def test_add_arrowheads_rejects_malformed_field(at: Any) -> None:
    renderer = bmr.GlyphRenderer(glyph=MultiLine())
    with pytest.raises(ValueError):
        renderer.add_arrowheads(at=at)
    assert renderer.glyph.path_markings == []


@pytest.mark.parametrize("at", [-0.1, 1.1, float("nan"), float("inf"), [0.5, -0.1], [True]])
def test_add_arrowheads_rejects_invalid_fractions(at: Any) -> None:
    renderer = bmr.GlyphRenderer(glyph=Segment())
    with pytest.raises(ValueError):
        renderer.add_arrowheads(at=at)
    assert renderer.glyph.path_markings == []


@pytest.mark.parametrize("fractions", [[0, 1], [0.25, 0.75]])
def test_add_arrowheads_accepts_numpy_array(fractions: list[float]) -> None:
    renderer = bmr.GlyphRenderer(glyph=Segment())
    markings = renderer.add_arrowheads(at=np.asarray(fractions))
    assert markings.positions == fractions
    assert renderer.glyph.path_markings == [markings]


@pytest.mark.parametrize("at", [np.array(0.5), np.array([[0.25, 0.75]])])
def test_add_arrowheads_rejects_arrays_of_wrong_rank(at: Any) -> None:
    renderer = bmr.GlyphRenderer(glyph=Segment())
    with pytest.raises(ValueError, match="one-dimensional"):
        renderer.add_arrowheads(at=at)
    assert renderer.glyph.path_markings == []


@pytest.mark.parametrize(("at", "message"), [
    ("edn", "Did you mean 'end'"),
    ("arrow_positions", r"Use field\('arrow_positions'\)"),
])
def test_add_arrowheads_rejects_unknown_placement_names(at: Any, message: str) -> None:
    renderer = bmr.GlyphRenderer(glyph=Segment())
    with pytest.raises(ValueError, match=message):
        renderer.add_arrowheads(at=at)
    assert renderer.glyph.path_markings == []


@pytest.mark.parametrize("at", ["end", 1.0])
def test_add_arrowheads_uses_path_validation_on_unsupported_glyphs(at: Any) -> None:
    renderer = cast(Any, bmr.GlyphRenderer(glyph=Scatter()))
    with pytest.raises(ValueError, match=r"add_path_marking\(\) does not support Scatter"):
        renderer.add_arrowheads(at=at)
    assert "path_markings" not in renderer.glyph.properties()


def test_add_path_marking_accepts_vectorized_inset_and_state_markings() -> None:
    glyph = MultiLine()
    selection_glyph = MultiLine()
    nonselection_glyph = MultiLine()
    renderer = bmr.GlyphRenderer(
        data_source=ColumnDataSource(data=dict(inset=[12])),
        glyph=glyph,
        selection_glyph=selection_glyph,
        nonselection_glyph=nonselection_glyph,
    )
    marking = NormalHead(fill_color="gray")
    selection_marking = NormalHead(fill_color="orange")

    path_marking = renderer.add_path_marking(marking, at="end",
        inset="inset",
        selection_marking=selection_marking,
        nonselection_marking=None,
    )

    assert path_marking.marking is marking
    assert path_marking.inset == "inset"
    assert glyph.path_markings == [path_marking]
    assert selection_glyph.path_markings[0].marking is selection_marking
    assert selection_glyph.path_markings[0].inset == "inset"
    assert nonselection_glyph.path_markings == []


class TestGlyphRenderer_construct_color_bar:

    @pytest.mark.parametrize("mapper", (linear_cmap, log_cmap))
    def test_fill_good(self, mapper):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Scatter(fill_color=linear_cmap("foo", "Viridis256", 0, 100))
        cb = renderer.construct_color_bar(title="Title")
        assert isinstance(cb, ColorBar)
        assert cb.color_mapper is renderer.glyph.fill_color.transform
        assert cb.title == "Title"

    def test_fill_missing_transform(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Scatter()

        msg = "expected fill_color to be a field with a ColorMapper transform"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar()

    @pytest.mark.parametrize("mapper", (linear_cmap, log_cmap))
    def test_line_good(self, mapper):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = MultiLine(line_color=linear_cmap("foo", "Viridis256", 0, 100))
        cb = renderer.construct_color_bar(title="Title")
        assert isinstance(cb, ColorBar)
        assert cb.color_mapper is renderer.glyph.line_color.transform
        assert cb.title == "Title"

    def test_line_missing_transform(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = MultiLine()

        msg = "expected line_color to be a field with a ColorMapper transform"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar()

    @pytest.mark.parametrize("mapper", (linear_cmap, log_cmap))
    def test_text_good(self, mapper):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Text(text_color=linear_cmap("foo", "Viridis256", 0, 100))
        cb = renderer.construct_color_bar(title="Title")
        assert isinstance(cb, ColorBar)
        assert cb.color_mapper is renderer.glyph.text_color.transform
        assert cb.title == "Title"

    def test_text_missing_transform(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Text()

        msg = "expected text_color to be a field with a ColorMapper transform"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar()

    @pytest.mark.parametrize("mapper", (linear_cmap, log_cmap))
    def test_image_good(self, mapper):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Image(color_mapper=linear_cmap("foo", "Viridis256", 0, 100).transform)
        cb = renderer.construct_color_bar(title="Title")
        assert isinstance(cb, ColorBar)
        assert cb.color_mapper is renderer.glyph.color_mapper
        assert cb.title == "Title"

    def test_image_stack_good(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = ImageStack(color_mapper=WeightedStackColorMapper())
        cb = renderer.construct_color_bar(title="Title")
        assert isinstance(cb, ColorBar)
        assert cb.color_mapper is renderer.glyph.color_mapper
        assert cb.title == "Title"

    def test_unknown_glyph_type(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = ImageRGBA()

        msg = f"construct_color_bar does not handle glyph type {type(renderer.glyph).__name__}"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar()

class TestGlyphRenderer_check_bad_column_name:

    def test_web_data_source(self) -> None:
        renderer = bmr.GlyphRenderer(data_source=WebDataSource())

        assert renderer._check_bad_column_name() == []

    def test_non_cds_data_source(self) -> None:
        renderer = bmr.GlyphRenderer(data_source=GeoJSONDataSource())

        assert renderer._check_bad_column_name() == []

    def test_empty(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Scatter()

        assert renderer._check_bad_column_name() == []

    def test_good(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource(data=dict(x=[], y=[])))
        renderer.glyph = Scatter(x="x", y="y")

        assert renderer._check_bad_column_name() ==  []

    def test_bad_with_matches(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource(data=dict(x=[], y=[])))
        renderer.glyph = Scatter(x="xx", y="yy")

        check = renderer._check_bad_column_name()

        assert len(check) == 1
        assert check[0] == ValidationIssue(
            code=1001,
            name='BAD_COLUMN_NAME',
            text='Glyph refers to nonexistent column name. This could either be due to a misspelling or typo, or due to an expected column being missing. ',
            extra=f"x='xx' [closest match: 'x'], y='yy' [closest match: 'y'] {{renderer: {renderer}}}",
        )

    def test_bad_with_no_matches(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource(data=dict(x=[], y=[])))
        renderer.glyph = Scatter(x="foo", y="bar")

        check = renderer._check_bad_column_name()

        assert len(check) == 1
        assert check[0] == ValidationIssue(
            code=1001,
            name='BAD_COLUMN_NAME',
            text='Glyph refers to nonexistent column name. This could either be due to a misspelling or typo, or due to an expected column being missing. ',
            extra=f"x='foo' [no close matches], y='bar' [no close matches] {{renderer: {renderer}}}",
        )

    def test_bad_with_mixed_matches(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource(data=dict(x=[], y=[])))
        renderer.glyph = Scatter(x="xx", y="bar")

        check = renderer._check_bad_column_name()

        assert len(check) == 1
        assert check[0] == ValidationIssue(
            code=1001,
            name='BAD_COLUMN_NAME',
            text='Glyph refers to nonexistent column name. This could either be due to a misspelling or typo, or due to an expected column being missing. ',
            extra=f"x='xx' [closest match: 'x'], y='bar' [no close matches] {{renderer: {renderer}}}",
        )

@pytest.mark.parametrize('glyph', (Line, Patch))
def test_check_cdsview_filters_with_connected_error(glyph) -> None:
    renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
    renderer.glyph = glyph()

    assert renderer._check_cdsview_filters_with_connected() == []

    renderer.view.filter = IndexFilter()
    check = renderer._check_cdsview_filters_with_connected()
    assert len(check) == 1
    assert check[0] == ValidationIssue(
        code=1024,
        name='CDSVIEW_FILTERS_WITH_CONNECTED',
        text='CDSView filters are not compatible with glyphs with connected topology such as Line or Patch',
        extra=str(renderer),
    )

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

@pytest.mark.parametrize("fraction", [0, 0.25, 0.5, 0.75, 1])
def test_fractional_decoration(fraction: float) -> None:
    from bokeh.models import NormalHead, Segment

    renderer = bmr.GlyphRenderer(glyph=Segment())
    path_marking = renderer.add_path_marking(NormalHead(), at=[fraction])
    assert path_marking.positions == [fraction]
    assert renderer.glyph.path_markings == [path_marking]


@pytest.mark.parametrize("fraction", [-0.1, 1.1, float("nan"), float("inf")])
def test_invalid_decoration_fraction_is_atomic(fraction: float) -> None:
    from bokeh.models import NormalHead, Segment

    renderer = bmr.GlyphRenderer(glyph=Segment())
    with pytest.raises(ValueError):
        renderer.add_path_marking(NormalHead(), at=[fraction])
    assert renderer.glyph.path_markings == []


def test_unsupported_path_decoration_is_atomic() -> None:
    from bokeh.models import NormalHead, Rect, Segment

    for renderer in [bmr.GlyphRenderer(glyph=Rect()), bmr.GlyphRenderer(glyph=Segment(), selection_glyph=Rect())]:
        with pytest.raises(ValueError, match="does not support Rect"):
            renderer.add_path_marking(NormalHead(), at=[0.25])
        if isinstance(renderer.glyph, Segment):
            assert renderer.glyph.path_markings == []
        else:
            assert "path_markings" not in renderer.glyph.properties()


def test_arc_accepts_named_and_fractional_decorations() -> None:
    from bokeh.models import Arc, NormalHead

    renderer = bmr.GlyphRenderer(glyph=Arc())
    path_marking = renderer.add_path_marking(NormalHead(), at="middle")
    fractional = renderer.add_path_marking(NormalHead(), at=[0.5])
    assert renderer.glyph.path_markings == [path_marking, fractional]


@pytest.mark.parametrize("at", ["middle", 0.5, [0.5], field("positions")])
def test_add_path_marking_rejects_inset_away_from_endpoints(at: Any) -> None:
    renderer = bmr.GlyphRenderer(glyph=MultiLine())
    with pytest.raises(ValueError):
        renderer.add_path_marking(NormalHead(), at=at, inset=0)
    assert renderer.glyph.path_markings == []


def test_path_markings_field_and_state_markings() -> None:
    source = ColumnDataSource(dict(xs=[[0, 1], [0, 1]], ys=[[0, 0], [1, 1]],
                                  positions=[[0.2, 0.8], []]))
    selected = MultiLine()
    renderer = bmr.GlyphRenderer(glyph=MultiLine(), selection_glyph=selected, data_source=source)
    head = NormalHead()
    selection_head = NormalHead(fill_color="orange")
    markings = renderer.add_path_marking(head, at=field("positions"), selection_marking=selection_head)
    assert markings.positions == field("positions")
    assert selected.path_markings[0].positions == field("positions")
    assert selected.path_markings[0].marking is selection_head
    assert renderer.glyph.path_markings == [markings]
