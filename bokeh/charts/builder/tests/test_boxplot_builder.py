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

from bokeh.charts import BoxPlot

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def test_array_input(test_data):
    box_plot = BoxPlot(test_data.auto_data.mpg.values,
                       title="label='cyl', values='mpg'")
    assert len(box_plot.renderers) > 0
