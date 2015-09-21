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

from collections import OrderedDict
import unittest
from mock import patch

import numpy as np
from numpy.testing import assert_array_equal, assert_array_almost_equal
import pandas as pd

from bokeh._legacy_charts import Histogram

from ._utils import create_chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestHistogram(unittest.TestCase):
    def test_supported_input(self):
        normal = [1, 2, 3, 1]
        lognormal = [5, 4, 4, 1]
        xyvalues = OrderedDict(normal=normal, lognormal=lognormal)

        xyvaluesdf = pd.DataFrame(xyvalues)

        exptected = dict(
            leftnormal=[1., 1.4, 1.8, 2.2, 2.6],
            rightnormal=[1.4, 1.8, 2.2, 2.6, 3.],
            lognormal=[5, 4, 4, 1],
            edgeslognormal=[1., 1.8, 2.6, 3.4, 4.2, 5.],
            bottomlognormal=[0, 0, 0, 0, 0],
            bottomnormal=[0, 0, 0, 0, 0],
            edgesnormal=[1., 1.4, 1.8, 2.2, 2.6, 3.],
            histlognormal=[0.3125, 0., 0., 0.625, 0.3125],
            leftlognormal=[1., 1.8, 2.6, 3.4, 4.2],
            normal=[1, 2, 3, 1],
            rightlognormal=[1.8, 2.6, 3.4, 4.2, 5.],
            histnormal=[1.25, 0., 0.625, 0., 0.625],
        )

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            hm = create_chart(Histogram, _xy, bins=5)
            builder = hm._builders[0]
            self.assertEqual(sorted(builder._groups), sorted(list(xyvalues.keys())))
            for key, expected_v in exptected.items():
                assert_array_almost_equal(builder._data[key], expected_v, decimal=2)

        lvalues = [[1, 2, 3, 1], [5, 4, 4, 1]]
        for i, _xy in enumerate([lvalues, np.array(lvalues)]):
            hm = create_chart(Histogram, _xy, bins=5)
            builder = hm._builders[0]
            self.assertEqual(builder._groups, ['0', '1'])
            for key, expected_v in exptected.items():
                # replace the keys because we have 0, 1 instead of normal and lognormal
                key = key.replace('lognormal', '1').replace('normal', '0')
                assert_array_almost_equal(builder._data[key], expected_v, decimal=2)

    @patch('bokeh._legacy_charts.builder.histogram_builder.np.histogram', return_value=([1, 3, 4], [2.4, 4]))
    def test_histogram_params(self, histogram_mock):
        inputs = [[5, 0, 0.5, True], [3, 1, 0, False]]
        normal = [1, 2, 3, 1]
        lognormal = [5, 4, 4, 1]
        xyvalues = OrderedDict()
        xyvalues['normal'] = normal
        xyvalues['lognormal'] = lognormal

        for (bins, mu, sigma, dens) in inputs:
            histogram_mock.reset_mock()
            kws = dict(bins=bins, mu=mu, sigma=sigma, density=dens)
            hm = create_chart(Histogram, xyvalues, compute_values=False, **kws)
            builder = hm._builders[0]
            # ensure all class attributes have been correctly set
            for key, value in kws.items():
                self.assertEqual(getattr(builder, key), value)

            builder._process_data()
            # ensure we are calling numpy.histogram with the right args
            calls = histogram_mock.call_args_list
            assert_array_equal(calls[0][0][0], np.array([1, 2, 3, 1]))
            assert_array_equal(calls[1][0][0], np.array([5, 4, 4, 1]))
            self.assertEqual(calls[0][1]['bins'], bins)
            self.assertEqual(calls[1][1]['bins'], bins)
            self.assertEqual(calls[0][1]['density'], dens)
            self.assertEqual(calls[1][1]['density'], dens)
