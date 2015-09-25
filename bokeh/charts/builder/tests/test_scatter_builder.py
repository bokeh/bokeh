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

from bokeh.charts import Scatter

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def test_list_input(test_data):
    scatter0 = Scatter(x=test_data.list_data[0])
    assert len(scatter0.renderers) > 0
