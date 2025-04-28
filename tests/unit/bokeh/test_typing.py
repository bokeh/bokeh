#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# NOTE:
#
# This file is meant only for type-checking with mypy. Thus "test" functions
# are prefixed with `mypy_test_` instead of the regular `test_`. Attempting
# to run this test file with pytest with `mypy_` removed will result in
# inevitable errors, e.g.:
#
#   TypeError: type 'GlyphRenderer' is not subscriptable
#
# This may get resolved as typing in Python matures. However, there is no
# need to value test anything in this file, because that's already done
# elsewhere.

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Literal

# External imports
from typing_extensions import assert_type  # for Python 3.10

# Bokeh imports
from bokeh.models.annotations import LegendItem
from bokeh.models.glyph import Glyph
from bokeh.models.renderers import GlyphRenderer
from bokeh.plotting import figure

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def mypy_test_figure_list_attr_splat() -> None:
    p = figure()
    p.scatter([1, 2, 3], [1, 2, 3], legend_label="scatter")

    assert_type(p.axis.dimension, Literal[0, 1, "auto"])
    assert_type(p.xaxis.dimension, Literal[0, 1, "auto"])
    assert_type(p.yaxis.dimension, Literal[0, 1, "auto"])

    assert_type(p.grid.dimension, Literal[0, 1])
    assert_type(p.xgrid.dimension, Literal[0, 1])
    assert_type(p.ygrid.dimension, Literal[0, 1])

    assert_type(p.legend.items, list[LegendItem] | list[tuple[str, list[GlyphRenderer[Glyph]]]])
    assert_type(p.hover.show_arrow, bool)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
