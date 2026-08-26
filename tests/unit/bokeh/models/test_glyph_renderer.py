#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh.core.validation.check import ValidationIssue
from bokeh.models import (
    ColorBar,
    ColumnDataSource,
    GeoJSONDataSource,
    Image,
    ImageRGBA,
    ImageStack,
    IndexedDataSource,
    IndexFilter,
    Line,
    Plot,
    MultiLine,
    NormalHead,
    Patch,
    Scatter,
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

class RecordDataSource(IndexedDataSource):
    pass

def test_accepts_non_columnar_data_source() -> None:
    source = RecordDataSource()
    renderer = bmr.GlyphRenderer(data_source=source, glyph=Scatter(x="x", y="y"))

    assert renderer.data_source is source

def test_plot_add_glyph_accepts_non_columnar_data_source() -> None:
    source = RecordDataSource()
    renderer = Plot().add_glyph(source, Scatter(x="x", y="y"))

    assert renderer.data_source is source


def test_add_path_decoration_accepts_vectorized_inset_and_state_markings() -> None:
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

    decoration = renderer.add_path_decoration(marking, node="end",
        inset="inset",
        selection_marking=selection_marking,
        nonselection_marking=None,
    )

    assert decoration.marking is marking
    assert decoration.inset == "inset"
    assert glyph.decorations == [decoration]
    assert selection_glyph.decorations[0].marking is selection_marking
    assert selection_glyph.decorations[0].inset == "inset"
    assert nonselection_glyph.decorations == []


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
    decoration = renderer.add_path_markings(NormalHead(), positions=[fraction])
    assert decoration.positions == [fraction]
    assert renderer.glyph.decorations == [decoration]


@pytest.mark.parametrize("fraction", [-0.1, 1.1, float("nan"), float("inf")])
def test_invalid_decoration_fraction_is_atomic(fraction: float) -> None:
    from bokeh.models import NormalHead, Segment

    renderer = bmr.GlyphRenderer(glyph=Segment())
    with pytest.raises(ValueError):
        renderer.add_path_markings(NormalHead(), positions=[fraction])
    assert renderer.glyph.decorations == []


def test_unsupported_path_decoration_is_atomic() -> None:
    from bokeh.models import NormalHead, Rect, Segment

    for renderer in [bmr.GlyphRenderer(glyph=Rect()), bmr.GlyphRenderer(glyph=Segment(), selection_glyph=Rect())]:
        with pytest.raises(ValueError, match="does not support Rect"):
            renderer.add_path_markings(NormalHead(), positions=[0.25])
        assert renderer.glyph.decorations == []
        if isinstance(renderer.selection_glyph, Rect):
            assert renderer.selection_glyph.decorations == []


def test_arc_accepts_named_and_fractional_decorations() -> None:
    from bokeh.models import Arc, NormalHead

    renderer = bmr.GlyphRenderer(glyph=Arc())
    decoration = renderer.add_path_decoration(NormalHead(), node="middle")
    fractional = renderer.add_path_markings(NormalHead(), positions=[0.5])
    assert renderer.glyph.decorations == [decoration, fractional]


def test_add_path_decoration_rejects_fractional_nodes() -> None:
    renderer = bmr.GlyphRenderer(glyph=MultiLine())
    with pytest.raises(ValueError):
        renderer.add_path_decoration(NormalHead(), node=0.5)
    assert renderer.glyph.decorations == []


def test_path_markings_field_and_state_markings() -> None:
    source = ColumnDataSource(dict(xs=[[0, 1], [0, 1]], ys=[[0, 0], [1, 1]],
                                  positions=[[0.2, 0.8], []]))
    selected = MultiLine()
    renderer = bmr.GlyphRenderer(glyph=MultiLine(), selection_glyph=selected, data_source=source)
    head = NormalHead()
    selection_head = NormalHead(fill_color="orange")
    markings = renderer.add_path_markings(head, positions="positions", selection_marking=selection_head)
    assert markings.positions == "positions"
    assert selected.decorations[0].positions == "positions"
    assert selected.decorations[0].marking is selection_head
    assert renderer.glyph.decorations == [markings]
