"""This is the Bokeh charts testing interface.

"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from __future__ import absolute_import

import pytest

from bokeh.charts._builder import Builder

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


@pytest.fixture
def builder():
    return Builder()


def test_empty_builder(builder):
    assert builder.xlabel is None

