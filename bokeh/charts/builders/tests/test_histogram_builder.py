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

from bokeh.charts.builders.histogram_builder import HistogramBuilder

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def test_series_input(test_data):
    hist_builder = HistogramBuilder(test_data.auto_data.mpg)
    hist_builder.create()
    assert len(hist_builder.comp_glyphs) > 0
