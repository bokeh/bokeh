""" This is the Bokeh charts testing interface.

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

from bokeh.charts import Line

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def test_array_input(test_data):
    line0 = Line(y=test_data.list_data)
    assert len(line0.renderers) > 0
