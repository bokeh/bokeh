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

# External imports
import numpy as np

# Bokeh imports
from bokeh.models import (
    Circle,
    ColumnDataSource,
    HSpan,
    Line,
    MultiLine,
    Patches,
)
from bokeh.plotting import figure

#from unittest import mock

# Module under test
import bokeh.plotting._renderer as bpr # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class Test__pop_visuals:
    def test_basic_prop(self) -> None:
        kwargs = dict(fill_alpha=0.7, line_alpha=0.8, line_color="red")
        ca = bpr.pop_visuals(Circle, kwargs)
        assert ca['fill_alpha'] == 0.7
        assert ca['line_alpha'] == 0.8
        assert ca["line_color"] == "red"
        assert ca["fill_color"] == "#1f77b4"
        assert set(ca) == { "fill_color", "hatch_color", "line_color", "fill_alpha", "hatch_alpha", "line_alpha" }

    def test_basic_trait(self) -> None:
        kwargs = dict(fill_alpha=0.7, alpha=0.8, color="red")
        ca = bpr.pop_visuals(Circle, kwargs)
        assert ca['fill_alpha'] == 0.7
        assert ca['line_alpha'] == 0.8
        assert ca["line_color"] == "red"
        assert ca["fill_color"] == "red"
        assert set(ca) == { "fill_color", "hatch_color", "line_color", "fill_alpha", "hatch_alpha", "line_alpha" }

    def test_override_defaults_with_prefix(self) -> None:
        glyph_kwargs = dict(fill_alpha=1, line_alpha=1)
        kwargs=dict(alpha=0.6)
        ca = bpr.pop_visuals(Circle, kwargs, prefix='nonselection_', defaults=glyph_kwargs, override_defaults={'alpha':0.1})
        assert ca['fill_alpha'] == 0.1
        assert ca['hatch_alpha'] == 0.1
        assert ca['line_alpha'] == 0.1

    def test_defaults(self) -> None:
        kwargs = dict(fill_alpha=0.7, line_alpha=0.8, line_color="red")
        ca = bpr.pop_visuals(Circle, kwargs, defaults=dict(line_color="blue", fill_color="green"))
        assert ca['fill_alpha'] == 0.7
        assert ca['line_alpha'] == 0.8
        assert ca["line_color"] == "red"
        assert ca["fill_color"] == "green"
        assert set(ca) == { "fill_color", "hatch_color", "line_color", "fill_alpha", "hatch_alpha", "line_alpha" }

    def test_override_defaults(self) -> None:
        kwargs = dict(fill_alpha=0.7, line_alpha=0.8)
        ca = bpr.pop_visuals(Circle, kwargs, defaults=dict(line_color="blue", fill_color="green"), override_defaults=dict(color="white"))
        assert ca['fill_alpha'] == 0.7
        assert ca['line_alpha'] == 0.8
        assert ca["line_color"] == "white"
        assert ca["fill_color"] == "white"
        assert set(ca) == { "fill_color", "hatch_color", "line_color", "fill_alpha", "hatch_alpha", "line_alpha" }

class Test_make_glyph:
    def test_null_visuals(self) -> None:
        kwargs = dict(fill_alpha=0.7, line_alpha=0.8, line_color="red")
        hover_visuals = None
        ca = bpr.make_glyph(Circle, kwargs, hover_visuals)
        assert ca is None
    def test_default_mute_glyph_basic_prop(self) -> None:
        kwargs = dict(fill_alpha=0.7, line_alpha=0.8, line_color="red")
        glyph_visuals = bpr.pop_visuals(Circle, kwargs)
        muted_visuals = bpr.pop_visuals(Circle, kwargs, prefix='muted_', defaults=glyph_visuals, override_defaults={'alpha':0.2})
        ca = bpr.make_glyph(Circle, kwargs, muted_visuals)
        assert ca.fill_alpha == 0.2
        assert ca.line_alpha == 0.2
        assert isinstance(ca, Circle)

    def test_user_specified_mute_glyph(self) -> None:
        kwargs = dict(fill_alpha=0.7, line_alpha=0.8, line_color="red", muted_color="blue", muted_alpha=0.4)
        glyph_visuals = bpr.pop_visuals(Circle, kwargs)
        muted_visuals = bpr.pop_visuals(Circle, kwargs, prefix='muted_', defaults=glyph_visuals, override_defaults={'alpha':0.2})
        ca = bpr.make_glyph(Circle, kwargs, muted_visuals)
        assert ca.fill_alpha == 0.4
        assert ca.line_alpha == 0.4
        assert ca.line_color == "blue"
        assert ca.fill_color == "blue"

class Test__process_sequence_literals:
    """Test that _process_sequence_literals handles line_dash sequences correctly"""

    def test_line_dash_as_list(self) -> None:
        """line_dash=[6, 3] should be treated as a scalar dash pattern"""
        p = figure()
        r = p.line([1, 2, 3], [1, 2, 3], line_dash=[6, 3])

        # Should create a Line glyph with line_dash as a fixed value
        assert isinstance(r.glyph, Line)
        assert r.glyph.line_dash == [6, 3]

        # Should NOT add line_dash to the data source
        assert "line_dash" not in r.data_source.data

    def test_line_dash_as_tuple(self) -> None:
        """line_dash=(6, 3) should be treated as a scalar dash pattern"""
        p = figure()
        r = p.line([1, 2, 3], [1, 2, 3], line_dash=(6, 3))

        assert isinstance(r.glyph, Line)
        # Tuples are preserved as tuples
        assert r.glyph.line_dash == (6, 3)
        assert "line_dash" not in r.data_source.data

    def test_line_dash_complex_pattern(self) -> None:
        """line_dash with complex pattern should work"""
        p = figure()
        r = p.line([1, 2, 3], [1, 2, 3], line_dash=[10, 5, 2, 5])

        assert isinstance(r.glyph, Line)
        assert r.glyph.line_dash == [10, 5, 2, 5]
        assert "line_dash" not in r.data_source.data

    def test_line_dash_empty_list(self) -> None:
        """line_dash=[] should create solid line"""
        p = figure()
        r = p.line([1, 2, 3], [1, 2, 3], line_dash=[])

        assert isinstance(r.glyph, Line)
        assert r.glyph.line_dash == []
        assert "line_dash" not in r.data_source.data

    def test_line_dash_string_still_works(self) -> None:
        """line_dash="dashed" should still work as before (converts to pattern)"""
        p = figure()
        r = p.line([1, 2, 3], [1, 2, 3], line_dash="dashed")

        assert isinstance(r.glyph, Line)
        # String patterns get converted to their integer sequences
        # "dashed" = [6]
        assert r.glyph.line_dash == [6]
        assert "line_dash" not in r.data_source.data

    def test_patches_line_dash_as_list(self) -> None:
        """Patches glyph should also handle line_dash list correctly"""
        p = figure()
        r = p.patches([[1, 2, 3]], [[1, 2, 3]], line_dash=[6, 3])

        assert isinstance(r.glyph, Patches)
        assert r.glyph.line_dash == [6, 3]
        assert "line_dash" not in r.data_source.data

    def test_hspan_line_dash_as_list(self) -> None:
        """hspan should handle line_dash list correctly (issue #13838)"""
        p = figure()
        r = p.hspan(y=0, line_dash=[5, 5])

        # hspan creates an HSpan glyph
        assert isinstance(r.glyph, HSpan)
        assert r.glyph.line_dash == [5, 5]
        assert "line_dash" not in r.data_source.data

    @pytest.mark.parametrize("dtype", [None, np.int32, np.uint8])
    def test_line_dash_numpy_int_array(self, dtype) -> None:
        """line_dash with numpy integer array should be treated as scalar"""
        p = figure()
        if dtype is None:
            dash_array = np.array([6, 3])
        else:
            dash_array = np.array([6, 3], dtype=dtype)
        r = p.line([1, 2, 3], [1, 2, 3], line_dash=dash_array)

        assert isinstance(r.glyph, Line)
        # NumPy arrays get converted to lists
        assert list(r.glyph.line_dash) == [6, 3]
        assert "line_dash" not in r.data_source.data

    def test_line_dash_float_list_fails(self) -> None:
        """line_dash with float list should fail validation"""
        p = figure()
        with pytest.raises(ValueError, match="failed to validate"):
            p.line([1, 2, 3], [1, 2, 3], line_dash=[6.0, 3.0])

    def test_line_dash_numpy_float_array_fails(self) -> None:
        """line_dash with numpy float array should fail validation"""
        p = figure()
        with pytest.raises(ValueError, match="failed to validate"):
            p.line([1, 2, 3], [1, 2, 3], line_dash=np.array([6.0, 3.0]))

    def test_line_dash_mixed_float_int_fails(self) -> None:
        """line_dash with mixed float and int should fail validation"""
        p = figure()
        with pytest.raises(ValueError, match="failed to validate"):
            p.line([1, 2, 3], [1, 2, 3], line_dash=[6, 3.0])

    def test_line_dash_numpy_empty_array(self) -> None:
        """line_dash with empty numpy array should create solid line"""
        p = figure()
        r = p.line([1, 2, 3], [1, 2, 3], line_dash=np.array([], dtype=int))

        assert isinstance(r.glyph, Line)
        assert list(r.glyph.line_dash) == []
        assert "line_dash" not in r.data_source.data

    def test_patches_line_dash_numpy_array(self) -> None:
        """Patches glyph should also handle numpy arrays correctly"""
        p = figure()
        r = p.patches([[1, 2, 3]], [[1, 2, 3]], line_dash=np.array([6, 3]))

        assert isinstance(r.glyph, Patches)
        assert list(r.glyph.line_dash) == [6, 3]
        assert "line_dash" not in r.data_source.data

    def test_multi_line_per_glyph_dash_patterns(self) -> None:
        """MultiLine should support per-glyph dash patterns via data source"""
        p = figure()
        source = ColumnDataSource(data={
            'xs': [[0, 1], [1, 2], [2, 3]],
            'ys': [[0, 1], [1, 2], [2, 3]],
            'line_dash': [[6, 3], [10, 5], [2, 4]],  # Per-glyph patterns
        })
        r = p.multi_line('xs', 'ys', line_dash='line_dash', source=source)

        assert isinstance(r.glyph, MultiLine)
        # line_dash should reference the field name
        assert r.glyph.line_dash == 'line_dash'
        # Data should be in the source
        assert 'line_dash' in r.data_source.data
        assert r.data_source.data['line_dash'] == [[6, 3], [10, 5], [2, 4]]

    def test_multi_line_per_glyph_dash_patterns_literal(self) -> None:
        """MultiLine should support per-glyph dash patterns as literal list"""
        p = figure()
        r = p.multi_line(
            xs=[[0, 1], [1, 2], [2, 3]],
            ys=[[0, 1], [1, 2], [2, 3]],
            line_dash=[[6, 3], [10, 5], [2, 4]],
        )

        assert isinstance(r.glyph, MultiLine)
        # line_dash should reference the auto-generated field name
        assert r.glyph.line_dash == 'line_dash'
        # Data should be automatically added to the source
        assert 'line_dash' in r.data_source.data
        assert r.data_source.data['line_dash'] == [[6, 3], [10, 5], [2, 4]]

    def test_multi_line_dash_patterns_wrong_length(self) -> None:
        """MultiLine with mismatched line_dash length should warn"""
        p = figure()
        with pytest.warns(UserWarning, match="columns must be of the same length"):
            r = p.multi_line(
                xs=[[0, 1], [1, 2], [2, 3]],
                ys=[[0, 1], [1, 2], [2, 3]],
                line_dash=[[6, 3], [10, 5]],  # Only 2 patterns for 3 lines
            )
            # Glyph is still created despite warning
            assert isinstance(r.glyph, MultiLine)
            assert 'line_dash' in r.data_source.data
            assert len(r.data_source.data['line_dash']) == 2

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

# # TODO: ideally, the list of arguments should be received directly from
# # GlyphRenderer, but such case requires a system that would be able to generate
# # acceptable values for parameters
# _renderer_args_values = {
#     'name': [None, '', 'test name'],
#     'x_range_name': [None, '', 'x range'],
#     'y_range_name': [None, '', 'y range'],
#     'level': [None, 'overlay'],
#     'view': [None, CDSView()],
#     'visible': [None, False, True],
#     'muted': [None, False, True]
# }
# @pytest.mark.parametrize('arg,values', [(arg, _renderer_args_values[arg]) for arg in bpr.RENDERER_ARGS])
# def test__glyph_receives_renderer_arg(arg, values) -> None:
#     for value in values:
#         with mock.patch('bokeh.plotting.helpers.GlyphRenderer', autospec=True) as gr_mock:
#             fn = bpd._glyph_function(Marker)
#             fn(figure(), x=0, y=0, **{arg: value})
#             _, kwargs = gr_mock.call_args
#             assert arg in kwargs and kwargs[arg] == value
