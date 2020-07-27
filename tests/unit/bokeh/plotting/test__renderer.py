#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh.models import Circle

#from mock import mock

#from bokeh.plotting import Figure

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
        assert set(ca) == { "fill_color", "line_color", "fill_alpha", "line_alpha" }

    def test_basic_trait(self) -> None:
        kwargs = dict(fill_alpha=0.7, alpha=0.8, color="red")
        ca = bpr.pop_visuals(Circle, kwargs)
        assert ca['fill_alpha'] == 0.7
        assert ca['line_alpha'] == 0.8
        assert ca["line_color"] == "red"
        assert ca["fill_color"] == "red"
        assert set(ca) == { "fill_color", "line_color", "fill_alpha", "line_alpha" }

    def test_override_defaults_with_prefix(self) -> None:
        glyph_kwargs = dict(fill_alpha=1, line_alpha=1)
        kwargs=dict(alpha=0.6)
        ca = bpr.pop_visuals(Circle, kwargs, prefix='nonselection_', defaults=glyph_kwargs, override_defaults={'alpha':0.1})
        assert ca['fill_alpha'] == 0.1
        assert ca['line_alpha'] == 0.1

    def test_defaults(self) -> None:
        kwargs = dict(fill_alpha=0.7, line_alpha=0.8, line_color="red")
        ca = bpr.pop_visuals(Circle, kwargs, defaults=dict(line_color="blue", fill_color="green"))
        assert ca['fill_alpha'] == 0.7
        assert ca['line_alpha'] == 0.8
        assert ca["line_color"] == "red"
        assert ca["fill_color"] == "green"
        assert set(ca) == { "fill_color", "line_color", "fill_alpha", "line_alpha" }

    def test_override_defaults(self) -> None:
        kwargs = dict(fill_alpha=0.7, line_alpha=0.8)
        ca = bpr.pop_visuals(Circle, kwargs, defaults=dict(line_color="blue", fill_color="green"), override_defaults=dict(color="white"))
        assert ca['fill_alpha'] == 0.7
        assert ca['line_alpha'] == 0.8
        assert ca["line_color"] == "white"
        assert ca["fill_color"] == "white"
        assert set(ca) == { "fill_color", "line_color", "fill_alpha", "line_alpha" }

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
#     'view': [None, CDSView(source=None)],
#     'visible': [None, False, True],
#     'muted': [None, False, True]
# }
# @pytest.mark.parametrize('arg,values', [(arg, _renderer_args_values[arg]) for arg in bpr.RENDERER_ARGS])
# def test__glyph_receives_renderer_arg(arg, values) -> None:
#     for value in values:
#         with mock.patch('bokeh.plotting.helpers.GlyphRenderer', autospec=True) as gr_mock:
#             fn = bpd._glyph_function(Marker)
#             fn(Figure(), x=0, y=0, **{arg: value})
#             _, kwargs = gr_mock.call_args
#             assert arg in kwargs and kwargs[arg] == value
