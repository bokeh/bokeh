#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import absolute_import

import mock
from mock import patch
import pytest

from bokeh.core.validation import check_integrity
from bokeh.plotting import figure
from bokeh.models import GlyphRenderer, Label, Plot, LinearAxis
from bokeh.models.ranges import FactorRange, DataRange1d, Range1d
from bokeh.models.scales import CategoricalScale, LinearScale, LogScale
from bokeh.models.tools import PanTool

import bokeh.models.plots as bmp

_LEGEND_EMPTY_WARNING = """
You are attemptings to set `plot.legend.location` on a plot that has zero legends added, this will have no effect.

Before legend properties can be set, you must add a Legend explicitly, or call a glyph method with the 'legend' parameter set.
"""

class TestPlotLegendProperty(object):

    def test_basic(self):
        plot = figure(tools='')
        x = plot.legend
        assert isinstance(x, bmp._list_attr_splat)
        assert len(x) == 0
        plot.circle([1,2], [3,4], legend="foo")
        x = plot.legend
        assert isinstance(x, bmp._list_attr_splat)
        assert len(x) == 1

    def test_warnign(self):
        plot = figure(tools='')
        with pytest.warns(UserWarning) as warns:
            plot.legend.location = "above"
            assert len(warns) == 1
            assert warns[0].message.args[0] == _LEGEND_EMPTY_WARNING

class TestPlotSelect(object):

    def setup_method(self):
        self._plot = figure(tools='pan')
        self._plot.circle([1,2,3], [3,2,1], name='foo')

    @patch('bokeh.models.plots.find')
    def test_string_arg(self, mock_find):
        self._plot.select('foo')
        assert mock_find.called
        assert mock_find.call_args[0][1] == dict(name='foo')

    @patch('bokeh.models.plots.find')
    def test_type_arg(self, mock_find):
        self._plot.select(PanTool)
        assert mock_find.called
        assert mock_find.call_args[0][1] == dict(type=PanTool)

    @patch('bokeh.models.plots.find')
    def test_kwargs(self, mock_find):
        kw = dict(name='foo', type=GlyphRenderer)
        self._plot.select(**kw)
        assert mock_find.called
        assert mock_find.call_args[0][1] == kw

    @patch('bokeh.models.plots.find')
    def test_single_selector_kwarg(self, mock_find):
        kw = dict(name='foo', type=GlyphRenderer)
        self._plot.select(selector=kw)
        assert mock_find.called
        assert mock_find.call_args[0][1] == kw

    def test_selector_kwarg_and_extra_kwargs(self):
        with pytest.raises(TypeError) as exc:
            self._plot.select(selector=dict(foo='foo'), bar='bar')
        assert "when passing 'selector' keyword arg, not other keyword args may be present" == str(exc.value)

    def test_bad_arg_type(self):
        with pytest.raises(TypeError) as exc:
            self._plot.select(10)
        assert "selector must be a dictionary, string or plot object." == str(exc.value)

    def test_too_many_args(self):
        with pytest.raises(TypeError) as exc:
            self._plot.select('foo', 'bar')
        assert 'select accepts at most ONE positional argument.' == str(exc.value)

    def test_no_input(self):
        with pytest.raises(TypeError) as exc:
            self._plot.select()
        assert 'select requires EITHER a positional argument, OR keyword arguments.' == str(exc.value)

    def test_arg_and_kwarg(self):
        with pytest.raises(TypeError) as exc:
            self._plot.select('foo', type=PanTool)
        assert 'select accepts EITHER a positional argument, OR keyword arguments (not both).' == str(exc.value)

class TestPlotValidation(object):

    def test_missing_renderers(self):
        p = figure()
        p.renderers = []
        with mock.patch('bokeh.core.validation.check.log') as mock_logger:
            check_integrity([p])
        assert mock_logger.warning.call_count == 1
        assert mock_logger.warning.call_args[0][0].startswith("W-1000 (MISSING_RENDERERS): Plot has no renderers")

    def test_missing_scale(self):
        p = figure()
        p.x_scale = None
        with mock.patch('bokeh.core.validation.check.log') as mock_logger:
            check_integrity([p])
        assert mock_logger.error.call_count == 1
        assert mock_logger.error.call_args[0][0].startswith("E-1008 (REQUIRED_SCALE): A required Scale object is missing: x_scale")

        p.y_scale = None
        with mock.patch('bokeh.core.validation.check.log') as mock_logger:
            check_integrity([p])
        assert mock_logger.error.call_count == 1
        assert mock_logger.error.call_args[0][0].startswith("E-1008 (REQUIRED_SCALE): A required Scale object is missing: x_scale, y_scale")

    def test_missing_range(self):
        p = figure()
        p.x_range = None
        with mock.patch('bokeh.core.validation.check.log') as mock_logger:
            check_integrity([p])
        assert mock_logger.error.call_count == 1
        assert mock_logger.error.call_args[0][0].startswith("E-1004 (REQUIRED_RANGE): A required Range object is missing: x_range")

        p.y_range = None
        with mock.patch('bokeh.core.validation.check.log') as mock_logger:
            check_integrity([p])
        assert mock_logger.error.call_count == 1
        assert mock_logger.error.call_args[0][0].startswith("E-1004 (REQUIRED_RANGE): A required Range object is missing: x_range, y_range")

    def test_bad_extra_range_name(self):
        p = figure()
        p.xaxis.x_range_name="junk"
        with mock.patch('bokeh.core.validation.check.log') as mock_logger:
            check_integrity([p])
        assert mock_logger.error.call_count == 1
        assert mock_logger.error.call_args[0][0].startswith(
            "E-1020 (BAD_EXTRA_RANGE_NAME): An extra range name is configued with a name that does not correspond to any range: x_range_name='junk' [LinearAxis"
        )

        p = figure()
        p.extra_x_ranges['foo'] = Range1d()
        p.grid.x_range_name="junk"
        with mock.patch('bokeh.core.validation.check.log') as mock_logger:
            check_integrity([p])
        assert mock_logger.error.call_count == 1
        assert mock_logger.error.call_args[0][0].startswith(
            "E-1020 (BAD_EXTRA_RANGE_NAME): An extra range name is configued with a name that does not correspond to any range: x_range_name='junk' [Grid"
        )
        assert mock_logger.error.call_args[0][0].count("Grid") == 2

def test_plot_add_layout_raises_error_if_not_render():
    plot = figure()
    with pytest.raises(ValueError):
        plot.add_layout(Range1d())


def test_plot_add_layout_raises_error_if_plot_already_on_annotation():
    plot = figure()
    with pytest.raises(ValueError):
        plot.add_layout(Label(plot=plot))


def test_plot_add_layout_adds_label_to_plot_renderers():
    plot = figure()
    label = Label()
    plot.add_layout(label)
    assert label in plot.renderers


def test_plot_add_layout_adds_axis_to_renderers_and_side_renderers():
    plot = figure()
    axis = LinearAxis()
    plot.add_layout(axis, 'left')
    assert axis in plot.renderers
    assert axis in plot.left


def test_sizing_mode_property_is_fixed_by_default():
    plot = figure()
    assert plot.sizing_mode is 'fixed'


class BaseTwinAxis(object):
    """Base class for testing extra ranges"""

    def verify_axis(self, axis_name):
        plot = Plot()
        range_obj = getattr(plot, 'extra_{}_ranges'.format(axis_name))
        range_obj['foo_range'] = self.get_range_instance()
        assert range_obj['foo_range']

    def test_x_range(self):
        self.verify_axis('x')

    def test_y_range(self):
        self.verify_axis('y')

    @staticmethod
    def get_range_instance():
        raise NotImplementedError


class TestCategoricalTwinAxis(BaseTwinAxis, object):
    """Test whether extra x and y ranges can be categorical"""

    @staticmethod
    def get_range_instance():
        return FactorRange('foo', 'bar')


class TestLinearTwinAxis(BaseTwinAxis, object):
    """Test whether extra x and y ranges can be Range1d"""

    @staticmethod
    def get_range_instance():
        return Range1d(0, 42)


def test_plot_with_no_title_specified_creates_an_empty_title():
    plot = Plot()
    assert plot.title.text == ""


def test_plot__scale_classmethod():
    assert isinstance(Plot._scale("auto"), LinearScale)
    assert isinstance(Plot._scale("linear"), LinearScale)
    assert isinstance(Plot._scale("log"), LogScale)
    assert isinstance(Plot._scale("categorical"), CategoricalScale)
    with pytest.raises(ValueError):
        Plot._scale("malformed_type")


def test__check_required_scale_has_scales():
    plot = Plot()
    check = plot._check_required_scale()
    assert check == []


def test__check_required_scale_missing_scales():
    plot = Plot(x_scale=None, y_scale=None)
    check = plot._check_required_scale()
    assert check != []


def test__check_compatible_scale_and_ranges_compat_numeric():
    plot = Plot(x_scale=LinearScale(), x_range=Range1d())
    check = plot._check_compatible_scale_and_ranges()
    assert check == []


    plot = Plot(y_scale=LogScale(), y_range=DataRange1d())
    check = plot._check_compatible_scale_and_ranges()
    assert check == []


def test__check_compatible_scale_and_ranges_compat_factor():
    plot = Plot(x_scale=CategoricalScale(), x_range=FactorRange())
    check = plot._check_compatible_scale_and_ranges()
    assert check == []


def test__check_compatible_scale_and_ranges_incompat_numeric_scale_and_factor_range():
    plot = Plot(x_scale=LinearScale(), x_range=FactorRange())
    check = plot._check_compatible_scale_and_ranges()
    assert check != []


def test__check_compatible_scale_and_ranges_incompat_factor_scale_and_numeric_range():
    plot = Plot(x_scale=CategoricalScale(), x_range=DataRange1d())
    check = plot._check_compatible_scale_and_ranges()
    assert check != []
