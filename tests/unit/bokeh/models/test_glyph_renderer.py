#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
    Circle,
    ColorBar,
    ColumnDataSource,
    GeoJSONDataSource,
    IndexFilter,
    Line,
    Patch,
    WebDataSource,
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


class TestGlyphRenderer_construct_color_bar:

    def test_bad_visual(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())

        msg = "construct_color_bar expects 'fill' or 'line' for visual, got 'junk'"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar("junk")

    @pytest.mark.parametrize("mapper", (linear_cmap, log_cmap))
    def test_default_good(self, mapper):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle(fill_color=linear_cmap("foo", "Viridis256", 0, 100))
        cb = renderer.construct_color_bar(title="Title")
        assert isinstance(cb, ColorBar)
        assert cb.color_mapper is renderer.glyph.fill_color.transform
        assert cb.title == "Title"

    def test_default_bad(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle()

        msg = "construct_color_bar expects fill_color to be a field with a colormapper transform"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar()

    @pytest.mark.parametrize("mapper", (linear_cmap, log_cmap))
    def test_fill_good(self, mapper):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle(fill_color=linear_cmap("foo", "Viridis256", 0, 100))
        cb = renderer.construct_color_bar("fill", title="Title")
        assert isinstance(cb, ColorBar)
        assert cb.color_mapper is renderer.glyph.fill_color.transform
        assert cb.title == "Title"

    def test_fill_bad(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle()

        msg = "construct_color_bar expects fill_color to be a field with a colormapper transform"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar("fill")

    @pytest.mark.parametrize("mapper", (linear_cmap, log_cmap))
    def test_line_good(self, mapper):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle(line_color=linear_cmap("foo", "Viridis256", 0, 100))
        cb = renderer.construct_color_bar("line", title="Title")
        assert isinstance(cb, ColorBar)
        assert cb.color_mapper is renderer.glyph.line_color.transform
        assert cb.title == "Title"

    def test_line_bad(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle()

        msg = "construct_color_bar expects line_color to be a field with a colormapper transform"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar("line")

class TestGlyphRenderer_check_bad_column_name:

    def test_web_data_source(self) -> None:
        renderer = bmr.GlyphRenderer(data_source=WebDataSource())

        assert renderer._check_bad_column_name() == []

    def test_non_cds_data_source(self) -> None:
        renderer = bmr.GlyphRenderer(data_source=GeoJSONDataSource())

        assert renderer._check_bad_column_name() == []

    def test_empty(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle()

        assert renderer._check_bad_column_name() == []

    def test_good(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource(data=dict(x=[], y=[])))
        renderer.glyph = Circle(x="x", y="y")

        assert renderer._check_bad_column_name() ==  []

    def test_bad_with_matches(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource(data=dict(x=[], y=[])))
        renderer.glyph = Circle(x="xx", y="yy")

        check = renderer._check_bad_column_name()

        assert len(check) == 1
        assert check[0] == ValidationIssue(
            code=1001,
            name='BAD_COLUMN_NAME',
            text='Glyph refers to nonexistent column name. This could either be due to a misspelling or typo, or due to an expected column being missing. ',
            extra=f"x='xx' [closest match: 'x'], y='yy' [closest match: 'y'] {{renderer: {renderer}}}"
        )

    def test_bad_with_no_matches(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource(data=dict(x=[], y=[])))
        renderer.glyph = Circle(x="foo", y="bar")

        check = renderer._check_bad_column_name()

        assert len(check) == 1
        assert check[0] == ValidationIssue(
            code=1001,
            name='BAD_COLUMN_NAME',
            text='Glyph refers to nonexistent column name. This could either be due to a misspelling or typo, or due to an expected column being missing. ',
            extra=f"x='foo' [no close matches], y='bar' [no close matches] {{renderer: {renderer}}}"
        )

    def test_bad_with_mixed_matches(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource(data=dict(x=[], y=[])))
        renderer.glyph = Circle(x="xx", y="bar")

        check = renderer._check_bad_column_name()

        assert len(check) == 1
        assert check[0] == ValidationIssue(
            code=1001,
            name='BAD_COLUMN_NAME',
            text='Glyph refers to nonexistent column name. This could either be due to a misspelling or typo, or due to an expected column being missing. ',
            extra=f"x='xx' [closest match: 'x'], y='bar' [no close matches] {{renderer: {renderer}}}"
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
        extra=str(renderer)
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
