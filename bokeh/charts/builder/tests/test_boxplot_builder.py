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
        xyvaluesdf = pd.DataFrame(xyvalues)
        exptected_datarect = {
            'colors': ['#f22c40', '#5ab738', '#407ee7', '#df5320', '#00ad9c', '#c33ff3'],
            'groups': ['bronze', 'silver', 'gold'],
            'iqr_centers': [2.5, 2.5, 2.5],
            'iqr_lengths': [3.0, 3.0, 4.5],
            'lower_center_boxes': [1.25, 1.5, 1.125],
            'lower_height_boxes': [0.5, 1.0, 1.75],
            'upper_center_boxes': [2.75, 3.0, 3.375],
            'upper_height_boxes': [2.5, 2.0, 2.75],
            'width': [0.8, 0.8, 0.8]
        }
        expected_scatter = {
            'colors': ['#f22c40', '#f22c40', '#f22c40', '#f22c40', '#5ab738', '#5ab738'],
            'out_x': ['bronze', 'bronze', 'bronze', 'bronze', 'silver', 'silver'],
            'out_y': [7.0, 10.0, 8.0, 7.0, 8.0, 8.0]
        }
        expected_seg = {
            'lower': [-3.0, -2.5, -4.75],
             'q0': [1.0, 1.0, 0.25],
             'q2': [4.0, 4.0, 4.75],
             'upper': [6.0, 6.5, 8.75]
        }
        groups = ['bronze', 'silver', 'gold']

        for i, _xy in enumerate([xyvalues, xyvaluesdf]):
            bp = create_chart(BoxPlot, _xy, marker='circle', outliers=True)
            builder = bp._builders[0]
            self.assertEqual(sorted(builder._groups), sorted(groups))
            for key, expected_v in exptected_datarect.items():
                self.assertEqual(builder._data_rect[key], expected_v)

            for key, expected_v in expected_scatter.items():
                self.assertEqual(builder._data_scatter[key], expected_v)

            for key, expected_v in expected_seg.items():
                self.assertEqual(builder._data_segment[key], expected_v)

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
        expected_scatter['out_x'] = ['0', '0', '0', '0', '1', '1']
        for i, _xy in enumerate([lvalues, np.array(lvalues)]):
            bp = create_chart(BoxPlot, _xy, marker='circle', outliers=True)
            builder = bp._builders[0]
            self.assertEqual(sorted(builder._groups), sorted(groups))
            for key, expected_v in exptected_datarect.items():
                self.assertEqual(builder._data_rect[key], expected_v)

            for key, expected_v in expected_scatter.items():
                self.assertEqual(builder._data_scatter[key], expected_v)

            for key, expected_v in expected_seg.items():
                self.assertEqual(builder._data_segment[key], expected_v)

            self.assertEqual(len(builder._legends), 3)
