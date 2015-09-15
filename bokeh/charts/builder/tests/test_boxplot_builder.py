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

import numpy as np
import pandas as pd

from bokeh.charts import BoxPlot

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

def test_array_input(test_data):
    box_plot = BoxPlot(test_data.auto_data.mpg.values,
                       title="label='cyl', values='mpg'")


    # def test_no_outliers(self):
#     xyvalues = [7.0, 7.0, 8.0, 8.0, 9.0, 9.0]
#     bp = create_chart(BoxPlot, xyvalues, outliers=True)
#     builder = bp._builders[0]
#     outliers = builder._data_scatter['out_y']
#     self.assertEqual(len(outliers), 0)
