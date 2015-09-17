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

import unittest

<<<<<<< HEAD
import numpy as np
from numpy.testing import assert_array_equal
import pandas as pd

from bokeh.charts import TimeSeries
from bokeh.util.testing import create_chart


=======
>>>>>>> 3b2b7e24b107c4bcedaf612cd5f3921e2742fe77
#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class TestTimeSeries(unittest.TestCase):
    def test_supported_input(self):
        pass
