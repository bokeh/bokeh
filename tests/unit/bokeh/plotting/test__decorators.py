#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from mock import mock

# Bokeh imports
from bokeh.models import CDSView, ColumnDataSource, Marker
from bokeh.plotting import Figure
from bokeh.plotting._renderer import RENDERER_ARGS

# Module under test
import bokeh.plotting._decorators as bpd # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


# TODO: ideally, the list of arguments should be received directly from
# GlyphRenderer, but such case requires a system that would be able to generate
# acceptable values for parameters
_renderer_args_values = dict(
    name=[None, "", "test name"],
    coordinates=[None, None],
    x_range_name=[None, "", "x range"],
    y_range_name=[None, "", "y range"],
    level=[None, "overlay"],
    view=[None, CDSView(source=ColumnDataSource())],
    visible=[None, False, True],
    muted=[None, False, True],
)
@pytest.mark.parametrize('arg,values', [(arg, _renderer_args_values[arg]) for arg in RENDERER_ARGS])
def test__glyph_receives_renderer_arg(arg, values) -> None:
    for value in values:
        with mock.patch('bokeh.plotting._renderer.GlyphRenderer', autospec=True) as gr_mock:
            def foo(**kw): pass
            fn = bpd.glyph_method(Marker)(foo)
            fn(Figure(), x=0, y=0, **{arg: value})
            _, kwargs = gr_mock.call_args
            assert arg in kwargs and kwargs[arg] == value

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
