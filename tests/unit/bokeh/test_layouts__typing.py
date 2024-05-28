#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from bokeh.layouts import gridplot
from bokeh.models import GridPlot
from bokeh.plotting import figure

# Module under test

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


def test_gridplot_no_ncols() -> None:
    def p():
        p = figure()
        p.scatter([1, 2, 3], [4, 5, 6])
        return p

    p0, p1, p2, p3 = p(), p(), p(), p()
    g = gridplot([[p0, p1], [p2, p3]], toolbar_location=None)

    assert isinstance(g, GridPlot) and len(g.children) == 4
    assert g.children == [(p0, 0, 0), (p1, 0, 1), (p2, 1, 0), (p3, 1, 1)]

    with pytest.raises(TypeError):
        gridplot([p0, p1, p2, p3], ncols=None)


def test_gridplot_using_ncols() -> None:
    def p():
        p = figure()
        p.scatter([1, 2, 3], [4, 5, 6])
        return p

    p0, p1, p2, p3 = p(), p(), p(), p()
    g = gridplot([p0, p1, p2, p3], ncols=2)

    assert isinstance(g, GridPlot) and len(g.children) == 4
    assert g.children == [(p0, 0, 0), (p1, 0, 1), (p2, 1, 0), (p3, 1, 1)]

    with pytest.raises(ValueError):
        gridplot([[p0, p1], [p2, p3]], ncols=2)


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
