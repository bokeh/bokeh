#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# External imports
import numpy as np

# Bokeh imports
from bokeh.plotting.contour import (
    FillData,
    LineData,
    contour_data,
    from_contour,
)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_contour_data:
    @pytest.mark.parametrize("xy_dim", [0, 1, 2])
    def test_xy_dim(self, xyz_levels, xy_dim):
        x, y, z, levels = xyz_levels
        if xy_dim == 0:
            x = y = None
        elif xy_dim == 2:
            x, y = np.meshgrid(x, y)

        data = contour_data(x, y, z, levels)
        fill, line = data.fill_data, data.line_data

        assert isinstance(fill, FillData)
        assert np.allclose(fill.lower_levels, [-0.5, 1.5])
        assert np.allclose(fill.upper_levels, [1.5, 3.5])
        assert len(fill.xs) == 2
        assert len(fill.ys) == 2
        assert np.allclose(fill.xs[0], [0, 1, 1.5, 1, 0.5, 0, 0])
        assert np.allclose(fill.ys[0], [0, 0, 0, 0.5, 1, 1, 0])
        assert np.allclose(fill.xs[1], [0.5, 1, 1.5, 2, 2, 1, 0.5])
        assert np.allclose(fill.ys[1], [1, 0.5, 0, 0, 1, 1, 1])

        assert isinstance(line, LineData)
        assert np.allclose(line.levels, [-0.5, 1.5, 3.5])
        assert len(line.xs) == 3
        assert len(line.ys) == 3
        assert np.allclose(line.xs[0], [])
        assert np.allclose(line.ys[0], [])
        assert np.allclose(line.xs[1], [0.5, 1, 1.5])
        assert np.allclose(line.ys[1], [1, 0.5, 0])
        assert np.allclose(line.xs[2], [])
        assert np.allclose(line.ys[2], [])

    @pytest.mark.parametrize("want_fill,want_line", [(True, True), (True, False), (False, True)])
    def test_fill_line(self, xyz_levels, want_fill, want_line):
        x, y, z, levels = xyz_levels

        data = contour_data(x, y, z, levels, want_fill=want_fill, want_line=want_line)
        fill, line = data.fill_data, data.line_data

        if want_fill:
            assert isinstance(fill, FillData)
        else:
            assert fill is None

        if want_line:
            assert isinstance(line, LineData)
        else:
            assert line is None

    def test_neither(self, xyz_levels):
        _, _, z, levels = xyz_levels
        with pytest.raises(ValueError, match="Neither fill nor line requested in contour_data"):
            contour_data(z=z, levels=levels, want_fill=False, want_line=False)

    def test_invalid_args(self):
        with pytest.raises(ValueError, match="No contour levels specified"):
            contour_data(z=[[0, 1], [2, 3]])

        with pytest.raises(ValueError, match="Contour levels must be increasing"):
            contour_data(z=[[0, 1], [2, 3]], levels=[2, 1, 0])

        with pytest.raises(ValueError, match="Contour levels must be increasing"):
            contour_data(z=[[0, 1], [2, 3]], levels=[0, 1, 1])

        with pytest.raises(TypeError):  # No z, not matching exception string as originates in ContourPy
            contour_data(levels=[1])

class Test_from_contour:
    @pytest.mark.parametrize("want_fill,want_line", [(True, True), (True, False), (False, True)])
    def test_fill_line(self, xyz_levels, want_fill, want_line):
        x, y, z, levels = xyz_levels

        kwargs = {}
        if want_fill:
            kwargs["fill_color"] = "red"
        if want_line:
            kwargs["line_color"] = "green"

        cr = from_contour(x, y, z, levels, **kwargs)
        assert np.allclose(cr.levels, levels)

        fill_data = cr.fill_renderer.data_source.data
        assert list(fill_data.keys()) == ["xs", "ys", "lower_levels", "upper_levels"]
        if want_fill:
            assert np.allclose(fill_data["lower_levels"], [-0.5, 1.5])
            assert np.allclose(fill_data["upper_levels"], [1.5, 3.5])
            assert len(fill_data["xs"]) == 2
            assert len(fill_data["ys"]) == 2
            assert np.allclose(fill_data["xs"][0], [0, 1, 1.5, 1, 0.5, 0, 0])
            assert np.allclose(fill_data["ys"][0], [0, 0, 0, 0.5, 1, 1, 0])
            assert np.allclose(fill_data["xs"][1], [0.5, 1, 1.5, 2, 2, 1, 0.5])
            assert np.allclose(fill_data["ys"][1], [1, 0.5, 0, 0, 1, 1, 1])

            glyph = cr.fill_renderer.glyph
            assert glyph.fill_color == "red"
            assert glyph.line_width == 0
        else:
            assert fill_data == dict(xs=[], ys=[], lower_levels=[], upper_levels=[])

        line_data = cr.line_renderer.data_source.data
        assert list(line_data.keys()) == ["xs", "ys", "levels"]
        if want_line:
            assert np.allclose(line_data["levels"], [-0.5, 1.5, 3.5])
            assert len(line_data["xs"]) == 3
            assert len(line_data["ys"]) == 3
            assert np.allclose(line_data["xs"][0], [])
            assert np.allclose(line_data["ys"][0], [])
            assert np.allclose(line_data["xs"][1], [0.5, 1, 1.5])
            assert np.allclose(line_data["ys"][1], [1, 0.5, 0])
            assert np.allclose(line_data["xs"][2], [])
            assert np.allclose(line_data["ys"][2], [])

            assert cr.line_renderer.glyph.line_color == "green"
        else:
            assert line_data == dict(xs=[], ys=[], levels=[])

    def test_neither(self, xyz_levels):
        _, _, z, levels = xyz_levels
        with pytest.raises(ValueError, match="Neither fill nor line requested in contour_data"):
            from_contour(z=z, levels=levels)  # No fill_color or line_color specified

    def test_invalid_args(self, xyz_levels):
        _, _, z, levels = xyz_levels
        with pytest.raises(ValueError, match="Unknown keyword arguments in 'from_contour': invalid_kwarg"):
            from_contour(z=z, levels=levels, fill_color="red", invalid_kwarg=23)

    def test_insufficient_colors(self, xyz_levels):
        x, y, z, levels = xyz_levels
        with pytest.raises(ValueError, match="Insufficient number of colors"):
            from_contour(x, y, z, levels, line_color=["red", "green"])

    def test_color_dict(self, xyz_levels):
        x, y, z, levels = xyz_levels
        colors_dict = {3: ["red", "green", "blue"]}
        cr = from_contour(x, y, z, levels, line_color=colors_dict)
        assert cr.line_renderer.data_source.data["line_color"] == ["red", "green", "blue"]

        with pytest.raises(ValueError, match="Dict of colors does not contain a key of 2"):
            from_contour(x, y, z, [1, 2], line_color=colors_dict)

    def test_color_longer_sequence(self, xyz_levels):
        x, y, z, levels = xyz_levels
        colors = ["red", "yellow", "green", "purple", "blue"]
        cr = from_contour(x, y, z, levels, line_color=colors)
        assert cr.line_renderer.data_source.data["line_color"] == ("red", "green", "blue")

    def test_visuals(self, xyz_levels):
        x, y, z, levels = xyz_levels
        kwargs = dict(
            fill_color="orange", fill_alpha=0.3,
            hatch_color="yellow", hatch_alpha=0.8, hatch_weight=2, hatch_scale=34, hatch_pattern="@",
            line_color="red", line_width=1.5, line_alpha=0.7, line_join="round", line_cap="square",
            line_dash="dotdash", line_dash_offset=3,
        )
        cr = from_contour(x, y, z, levels, **kwargs)
        fill = cr.fill_renderer.glyph
        assert fill.fill_color == "orange"
        assert fill.fill_alpha == 0.3
        assert fill.hatch_color == "yellow"
        assert fill.hatch_alpha == 0.8
        assert fill.hatch_weight == 2
        assert fill.hatch_scale == 34
        assert fill.hatch_pattern == "@"
        line = cr.line_renderer.glyph
        assert line.line_color == "red"
        assert line.line_width == 1.5
        assert line.line_alpha == 0.7
        assert line.line_join == "round"
        assert line.line_cap == "square"
        assert line.line_dash == "dotdash"
        assert line.line_dash_offset == 3

def test_contour_colorbar(xyz_levels):
    x, y, z, levels = xyz_levels
    cr = from_contour(x, y, z, levels, fill_color="red", line_color="black")
    color_bar = cr.construct_color_bar()
    assert color_bar.levels == levels
    assert color_bar.fill_renderer == cr.fill_renderer
    assert color_bar.line_renderer == cr.line_renderer

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@pytest.fixture
def xyz_levels():
    return [0, 1, 2], [0, 1], [[0, 1, 2], [1, 2, 3]], [-0.5, 1.5, 3.5]
