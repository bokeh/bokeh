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

import numpy as np
import pandas as pd
import blaze
from bokeh.charts import BoxPlot

from bokeh.charts.builder.tests._utils import create_chart

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestBoxPlot(unittest.TestCase):
    def test_supported_input(self):
        xyvalues = OrderedDict([
            ('bronze', np.array([7.0, 10.0, 8.0, 7.0, 4.0, 4.0, 1.0, 5.0, 2.0, 1.0,
                        4.0, 2.0, 1.0, 2.0, 4.0, 1.0, 0.0, 1.0, 1.0, 2.0,
                        0.0, 1.0, 0.0, 0.0, 1.0, 1.0])),
            ('silver', np.array([8., 4., 6., 4., 8., 3., 3., 2., 5., 6.,
                        1., 4., 2., 3., 2., 0., 0., 1., 2., 1.,
                        3.,  0.,  0.,  1.,  0.,  0.])),
            ('gold', np.array([6., 6., 6., 8., 4., 8., 6., 3., 2., 2.,  2.,  1.,
                      3., 1., 0., 5., 4., 2., 0., 0., 0., 1., 1., 0., 0.,
                      0.]))
        ])
        groups = ['bronze', 'silver', 'gold']
        xyvaluesdf = pd.DataFrame(xyvalues)
        xyvaluesbl = blaze.Data(xyvaluesdf)
        exptected_datarect = {
            'colors': ['#f22c40', '#5ab738', '#407ee7', '#df5320', '#00ad9c', '#c33ff3'],
            'groups': ['bronze', 'silver', 'gold'],
            'iqr_centers': [2.5, 2.5, 2.5],
            'iqr_lengths': [3.0, 3.0, 4.5],
            'width': [0.8, 0.8, 0.8]
        }
        expected_scatter = {
            'out_colors': ['#f22c40'],
            'out_x': ['bronze'],
            'out_y': [10.0]
        }
        expected_seg = {
            'lower': [-3.5, -3.5, -6.5],
             'q0': [1.0, 1.0, 0.25],
             'q2': [4.0, 4.0, 4.75],
             'upper': [8.5, 8.5, 11.5]
        }

        expect_rects = {
            'rect_center_bronze': [2.75, 1.25],
            'rect_height_bronze': [2.5, 0.5],
            'rect_center_silver': [3., 1.5],
            'rect_height_silver': [2.0, 1.],
            'rect_center_gold': [3.375, 1.125],
            'rect_height_gold': [2.75, 1.75],
        }

        for i, _xy in enumerate([xyvalues, xyvaluesdf, xyvaluesbl]):
            bp = create_chart(BoxPlot, _xy, marker='circle', outliers=True)
            builder = bp._builders[0]
            pre = builder.prefix
            self.assertEqual(pre, 'boxplot_%s_' % (bp._id.lower().replace("-", "_")))
            self.assertEqual(sorted(builder.y), sorted(groups))
            for key, expected_v in exptected_datarect.items():
                self.assertEqual(builder._data[pre + key], expected_v)

            for key, expected_v in expected_scatter.items():
                self.assertEqual(builder._data[pre + key], expected_v)

            for key, expected_v in expected_seg.items():
                self.assertEqual(builder._data[pre + key], expected_v)

            for key, expected_v in expect_rects.items():
                self.assertEqual(builder._data[pre + key], expected_v)

            self.assertEqual(len(builder._legends), 3)

        lvalues = [
            np.array([7.0, 10.0, 8.0, 7.0, 4.0, 4.0, 1.0, 5.0, 2.0, 1.0,
                    4.0, 2.0, 1.0, 2.0, 4.0, 1.0, 0.0, 1.0, 1.0, 2.0,
                    0.0, 1.0, 0.0, 0.0, 1.0, 1.0]),
            np.array([8., 4., 6., 4., 8., 3., 3., 2., 5., 6.,
                    1., 4., 2., 3., 2., 0., 0., 1., 2., 1.,
                    3.,  0.,  0.,  1.,  0.,  0.]),
            np.array([6., 6., 6., 8., 4., 8., 6., 3., 2., 2.,  2.,  1.,
                    3., 1., 0., 5., 4., 2., 0., 0., 0., 1., 1., 0., 0.,
                    0.])
        ]

        groups = exptected_datarect['groups'] = ['0', '1', '2']
        expected_scatter['out_x'] = ['0']
        for i, _xy in enumerate([lvalues, np.array(lvalues)]):
            bp = create_chart(BoxPlot, _xy, marker='circle', outliers=True)
            builder = bp._builders[0]
            pre = builder.prefix
            self.assertEqual(pre, 'boxplot_%s_' % (bp._id.lower().replace("-", "_")))
            self.assertEqual(sorted(builder.y), sorted(groups))
            for key, expected_v in exptected_datarect.items():
                self.assertEqual(builder._data[pre + key], expected_v)

            for key, expected_v in expected_scatter.items():
                self.assertEqual(builder._data[pre + key], expected_v)

            for key, expected_v in expected_seg.items():
                self.assertEqual(builder._data[pre + key], expected_v)

            self.assertEqual(len(builder._legends), 3)
