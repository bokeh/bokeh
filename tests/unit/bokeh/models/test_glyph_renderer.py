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
from bokeh.models import (
    Circle,
    ColorBar,
    ColumnDataSource,
    IndexFilter,
    Line,
    Patch,
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


class TestGlyphRenderer:

    def test_construct_color_bar_bad_visual(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())

        msg = "construct_color_bar expects 'fill' or 'line' for visual, got 'junk'"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar("junk")

    @pytest.mark.parametrize("mapper", (linear_cmap, log_cmap))
    def test_construct_color_bar_default_good(self, mapper):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle(fill_color=linear_cmap("foo", "Viridis256", 0, 100))
        cb = renderer.construct_color_bar(title="Title")
        assert isinstance(cb, ColorBar)
        assert cb.color_mapper is renderer.glyph.fill_color.transform
        assert cb.title == "Title"

    def test_construct_color_bar_default_bad(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle()

        msg = "construct_color_bar expects fill_color to be a field with a colormapper transform"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar()

    @pytest.mark.parametrize("mapper", (linear_cmap, log_cmap))
    def test_construct_color_bar_fill_good(self, mapper):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle(fill_color=linear_cmap("foo", "Viridis256", 0, 100))
        cb = renderer.construct_color_bar("fill", title="Title")
        assert isinstance(cb, ColorBar)
        assert cb.color_mapper is renderer.glyph.fill_color.transform
        assert cb.title == "Title"

    def test_construct_color_bar_fill_bad(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle()

        msg = "construct_color_bar expects fill_color to be a field with a colormapper transform"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar("fill")

    @pytest.mark.parametrize("mapper", (linear_cmap, log_cmap))
    def test_construct_color_bar_line_good(self, mapper):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle(line_color=linear_cmap("foo", "Viridis256", 0, 100))
        cb = renderer.construct_color_bar("line", title="Title")
        assert isinstance(cb, ColorBar)
        assert cb.color_mapper is renderer.glyph.line_color.transform
        assert cb.title == "Title"

    def test_construct_color_bar_line_bad(self):
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = Circle()

        msg = "construct_color_bar expects line_color to be a field with a colormapper transform"
        with pytest.raises(ValueError, match=msg):
            renderer.construct_color_bar("line")

    @pytest.mark.parametrize('glyph', (Line, Patch))
    def test_check_cdsview_filters_with_connected_error(self, glyph) -> None:
        renderer = bmr.GlyphRenderer(data_source=ColumnDataSource())
        renderer.glyph = glyph()

        check = renderer._check_cdsview_filters_with_connected()
        assert check == []

        renderer.view.filter = IndexFilter()
        check = renderer._check_cdsview_filters_with_connected()
        assert check != []

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
