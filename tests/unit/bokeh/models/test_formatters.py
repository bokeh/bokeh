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
from bokeh.models import ColumnDataSource, Toggle
from bokeh.util.warnings import BokehDeprecationWarning

# Module under test
import bokeh.models.formatters as bmf # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_deprecated_FuncTickFormatter() -> None:
    with pytest.warns(BokehDeprecationWarning):
        formatter = bmf.FuncTickFormatter()
        assert isinstance(formatter, bmf.CustomJSTickFormatter)

def test_custom_js_tick_formatter() -> None:
    source = ColumnDataSource({
        'fruits': ['apples', 'bananas', 'pears'],
        'counts': [6, 7, 3],
    })

    toggle = Toggle(label='Uppercase Ticks')

    formatter = bmf.CustomJSTickFormatter(code="""
        let label = source.data['fruits'][index];
        return toggle.active ? label.toUpperCase() : label
    """, args={'source': source, 'toggle': toggle})

    assert 'source' in formatter.args
    assert formatter.args['source'] is source
    assert 'toggle' in formatter.args
    assert formatter.args['toggle'] is toggle

    cutoff = 5

    formatter = bmf.CustomJSTickFormatter(code="""
        this.precision = this.precision || (ticks.length > cutoff ? 1 : 2);
        return Math.floor(tick) + " + " + (tick % 1).toFixed(this.precision);
    """, args={'cutoff': cutoff})

    assert 'cutoff' in formatter.args
    assert formatter.args['cutoff'] == cutoff

    with pytest.raises(AttributeError):
        # does not accept kwargs
        formatter = bmf.CustomJSTickFormatter(code="""
            this.precision = this.precision || (ticks.length > cutoff ? 1 : 2);
            return Math.floor(tick) + " + " + (tick % 1).toFixed(this.precision);
        """, cutoff=cutoff)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
