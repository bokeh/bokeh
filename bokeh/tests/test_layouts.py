#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.plotting import figure
from bokeh.layouts import column, row, gridplot, layout
from bokeh.models import Column, Row, GridBox

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_gridplot_merge_tools_flat():
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    gridplot([[p1, p2], [p3, p4]], merge_tools=True)

    for p in p1, p2, p3, p4:
        assert p.toolbar_location is None


def test_gridplot_merge_tools_with_None():
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    gridplot([[p1, None, p2], [p3, p4, None]], merge_tools=True)

    for p in p1, p2, p3, p4:
        assert p.toolbar_location is None


def test_gridplot_merge_tools_nested():
    p1, p2, p3, p4, p5, p6, p7 = figure(), figure(), figure(), figure(), figure(), figure(), figure()
    r1 = row(p1, p2)
    r2 = row(p3, p4)
    c = column(row(p5), row(p6))

    gridplot([[r1, r2], [c, p7]], merge_tools=True)

    for p in p1, p2, p3, p4, p5, p6, p7:
        assert p.toolbar_location is None


def test_gridplot_None():
    def p():
        p = figure()
        p.circle([1, 2, 3], [4, 5, 6])
        return p

    p0, p1, p2, p3 = p(), p(), p(), p()
    g = gridplot([[p0, p1], [None, None], [p2, p3]], toolbar_location=None)

    assert isinstance(g, GridBox) and len(g.children) == 4
    assert g.children == [(p0, 0, 0), (p1, 0, 1), (p2, 2, 0), (p3, 2, 1)]

def test_layout_simple():
    p1, p2, p3, p4 = figure(), figure(), figure(), figure()

    grid = layout([[p1, p2], [p3, p4]], sizing_mode='fixed')

    assert isinstance(grid, Column)
    for r in grid.children:
        assert isinstance(r, Row)


def test_layout_nested():
    p1, p2, p3, p4, p5, p6 = figure(), figure(), figure(), figure(), figure(), figure()

    grid = layout([[[p1, p1], [p2, p2]], [[p3, p4], [p5, p6]]], sizing_mode='fixed')

    assert isinstance(grid, Column)
    for r in grid.children:
        assert isinstance(r, Row)
        for c in r.children:
            assert isinstance(c, Column)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
