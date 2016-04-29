#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import absolute_import

from mock import patch
import unittest
import pytest

from bokeh.plotting import figure
from bokeh.models import GlyphRenderer, Label, Range1d, FactorRange, Plot
from bokeh.models.tools import PanTool


class TestPlotSelect(unittest.TestCase):

    def setUp(self):
        self._plot = figure(tools='pan')
        self._plot.circle([1,2,3], [3,2,1], name='foo')

    @patch('bokeh.models.plots.find')
    def test_string_arg(self, mock_find):
        self._plot.select('foo')
        self.assertTrue(mock_find.called)
        self.assertEqual(mock_find.call_args[0][1], dict(name='foo'))

    @patch('bokeh.models.plots.find')
    def test_type_arg(self, mock_find):
        self._plot.select(PanTool)
        self.assertTrue(mock_find.called)
        self.assertEqual(mock_find.call_args[0][1], dict(type=PanTool))

    @patch('bokeh.models.plots.find')
    def test_kwargs(self, mock_find):
        kw = dict(name='foo', type=GlyphRenderer)
        self._plot.select(**kw)
        self.assertTrue(mock_find.called)
        self.assertEqual(mock_find.call_args[0][1], kw)

    def test_too_many_args(self):
        with self.assertRaises(TypeError) as cm:
            self._plot.select('foo', 'bar')
        self.assertEqual(
            'select accepts at most ONE positional argument.',
            str(cm.exception)
        )

    def test_no_input(self):
        with self.assertRaises(TypeError) as cm:
            self._plot.select()
        self.assertEqual(
            'select requires EITHER a positional argument, OR keyword arguments.',
            str(cm.exception)
        )

    def test_arg_and_kwarg(self):
        with self.assertRaises(TypeError) as cm:
            self._plot.select('foo', type=PanTool)
        self.assertEqual(
            'select accepts EITHER a positional argument, OR keyword arguments (not both).',
            str(cm.exception)
        )


def test_plot_add_annotation_method():
    plot = figure()

    with pytest.raises(ValueError):
        plot.add_annotation(Range1d())

    with pytest.raises(ValueError):
        plot.add_annotation(Label(plot=figure()))

    label = Label()
    plot.add_annotation(label)

    assert label in plot.renderers

def test_responsive_property_is_false_by_default():
    plot = figure()
    assert plot.responsive is False


class BaseTwinAxis(object):
    """Base class for testing extra ranges"""

    def verify_axis(self, axis_name):
        plot = Plot()  # no need for setUp()
        range_obj = getattr(plot, 'extra_{}_ranges'.format(axis_name))
        range_obj['foo_range'] = self.get_range_instance()
        self.assertTrue(range_obj['foo_range'])

    def test_x_range(self):
        self.verify_axis('x')

    def test_y_range(self):
        self.verify_axis('y')

    @staticmethod
    def get_range_instance():
        raise NotImplementedError


class TestCategoricalTwinAxis(BaseTwinAxis, unittest.TestCase):
    """Test whether extra x and y ranges can be categorical"""

    @staticmethod
    def get_range_instance():
        return FactorRange('foo', 'bar')


class TestLinearTwinAxis(BaseTwinAxis, unittest.TestCase):
    """Test whether extra x and y ranges can be Range1d"""

    @staticmethod
    def get_range_instance():
        return Range1d(0, 42)


if __name__ == '__main__':
    unittest.main()
