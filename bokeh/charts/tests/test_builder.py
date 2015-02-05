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

import unittest
from mock import patch, Mock

from bokeh.charts._builder import Builder

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class TestBuilder(unittest.TestCase):
    def setUp(self):
        self.builder = Builder([], palette=['red', 'green'])

    def test_instantiate(self):
        self.builder.palette = ['red', 'green']

    # @patch('bokeh.charts._data_adapter.DataAdapter')
    # def test_prepare_values(self, adapter_mock):
    #     self.builder = Builder("bottom_left", ['red', 'green'])
    #     adapter_mock.assert_called_once_with([], force_alias=False)


    #     self.builder = Builder([1, 2, 3], "Test Leg", ['red', 'green'])
    #     self.builder.index = ['b']
    #     adapter_mock.get_index_and_data.assert_called_once_with(
    #         [1, 2, 3], ['b'], force_alias=False
    #     )

    # def test_create(self):
    #     chart = Mock()

    #     # prepare the builder with the mocks
    #     self.builder.make_renderers = Mock(return_value='called!')
    #     self.legends = ['l1', 'l2']
    #     self.builder.x_range = "X-Range"
    #     self.builder.y_range = "Y-Range"

    #     self.builder.create(chart)

    #     chart.add_renderers.assert_called_once('called')
    #     chart.orientation = 'bottom_left'
    #     chart.add_legend('bottom_left', self.legends)


