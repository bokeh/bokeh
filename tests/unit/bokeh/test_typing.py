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
from typing import TYPE_CHECKING, Literal, assert_type

if TYPE_CHECKING:
    import numpy as np
    import numpy.typing as npt
    import pandas as pd

# Bokeh imports
from bokeh.document import Document
from bokeh.io import curdoc
from bokeh.models.annotations import LegendItem
from bokeh.plotting import figure

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def mypy_test_curdoc() -> None:
    assert_type(curdoc(), Document)

def mypy_test_figure_list_attr_splat() -> None:
    p = figure()
    p.scatter([1, 2, 3], [1, 2, 3], legend_label="scatter")

    assert_type(p.axis.dimension, Literal[0, 1, "auto"])
    assert_type(p.xaxis.dimension, Literal[0, 1, "auto"])
    assert_type(p.yaxis.dimension, Literal[0, 1, "auto"])

    assert_type(p.grid.dimension, Literal[0, 1])
    assert_type(p.xgrid.dimension, Literal[0, 1])
    assert_type(p.ygrid.dimension, Literal[0, 1])

    assert_type(p.legend.items, list[LegendItem])
    assert_type(p.hover.show_arrow, bool)

def mypy_test_stack_methods(
    array_stackers: npt.NDArray[np.str_],
    index_stackers: pd.Index[str],
) -> None:
    p = figure()
    p.harea_stack(array_stackers)
    p.varea_stack(index_stackers)
    p.hbar_stack(array_stackers)
    p.vbar_stack(index_stackers)
    p.hline_stack(array_stackers)
    p.vline_stack(index_stackers)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
