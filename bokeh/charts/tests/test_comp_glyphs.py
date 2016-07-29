import numpy as np
import pandas as pd
from bokeh.charts.models import CompositeGlyph
from bokeh.charts.glyphs import (AreaGlyph, LineGlyph, PointGlyph, StepGlyph, BoxGlyph, BarGlyph)
from bokeh.charts.operations import stack
from bokeh.charts.stats import stats

from bokeh.models import ColumnDataSource


def test_area_base_values(test_data):
    """Test creating chart data source from array-like list data."""
    x = pd.Series(test_data.array_data[0])
    y = pd.Series(test_data.array_data[1])

    ag = AreaGlyph(x=x, y=y)

    assert ag.source.data['y_values'][0][0] == 0
    assert ag.source.data['y_values'][0][-1] == 0


def test_xyglyph_xy_range():
    def check_bounds(xyg, xmin=0, xmax=4, ymin=1, ymax=5):
        assert xyg.x_min == xmin
        assert xyg.x_max == xmax
        assert xyg.y_min == ymin
        assert xyg.y_max == ymax

    for Glyph in [LineGlyph, PointGlyph]:
        x = pd.Series([0, 1, 2, 3, 4])
        y = pd.Series([5, 4, 3, 2, 1])
        xyg = Glyph(x=x, y=y)
        check_bounds(xyg)

        x[1] = x[2] = np.nan
        xyg = Glyph(x=x, y=y)
        check_bounds(xyg)

        x[0] = np.nan
        xyg = Glyph(x=x, y=y)
        check_bounds(xyg, xmin=3)

        x[4] = np.nan
        xyg = Glyph(x=x, y=y)
        check_bounds(xyg, xmin=3, xmax=3)

        y[1] = y[2] = np.nan
        xyg = Glyph(x=x, y=y)
        check_bounds(xyg, xmin=3, xmax=3)

        y[0] = np.nan
        xyg = Glyph(x=x, y=y)
        check_bounds(xyg, xmin=3, xmax=3, ymax=2)

        y[4] = np.nan
        xyg = Glyph(x=x, y=y)
        check_bounds(xyg, xmin=3, xmax=3, ymax=2, ymin=2)


def test_comp_glyph_no_inputs():
    cg = CompositeGlyph()
    assert isinstance(cg.data, dict)
    assert isinstance(cg.df, pd.DataFrame)
    assert isinstance(cg.source, ColumnDataSource)


def test_comp_glyph_array_input(test_data):
    cg = CompositeGlyph(values=test_data.array_data[0])
    assert cg.data['values'] is not None


def test_step_glyph():
    xx = [-2, 0, 1, 3, 4, 5, 6, 9]
    dates = np.array(['2016-05-%02i' % i for i in range(1, 9)], dtype=np.datetime64)
    values = [1, 2, 3, 2, 1, 5, 4, 5]

    # Test with integer x
    g = StepGlyph(x=xx, y=values)
    data = g.renderers[0].data_source.data
    for i in range(0, len(xx)-1):
        assert data['x_values'][i*2+0] == xx[i+0]
        assert data['x_values'][i*2+1] == xx[i+1]

    # Test with dates (#3616)
    g = StepGlyph(x=dates, y=values)
    data = g.renderers[0].data_source.data
    for i in range(0, len(xx)-1):
        assert data['x_values'][i*2+0] == dates[i+0]
        assert data['x_values'][i*2+1] == dates[i+1]


# operations

def test_bar_stacking():
    bar1, bar2, bar3 = BarGlyph('a', 5), BarGlyph('a', 2), BarGlyph('b', 2)
    stack(bar1, bar2, bar3)

    # are stacked
    assert bar1.y_max == bar2.y_min

    # not stacked
    assert bar3.y_min == 0.0


def test_area_stacking():
    area1 = AreaGlyph(x=[1, 2, 3, 4, 5], y=[2, 9, 2, 5, 10])
    area2 = AreaGlyph(x=[1, 2, 3, 4, 5], y=[1, 1, 1, 1, 1])

    stack(area1, area2)

    area2_stacked_values = [0, 3, 10, 3, 6, 11, 0, 0, 10, 5, 2, 9, 2, 0]
    comparison = pd.Series(area2_stacked_values) - pd.Series(area2.df[
                                                                 'y_values'].values[0])
    assert comparison.sum() == 0


def test_boxplot():
    # test source: https://en.wikipedia.org/wiki/Interquartile_range
    data=[102, 104, 105, 107, 108, 109, 110, 112, 115, 116, 118]
    box = BoxGlyph(label={'cat': 'a'}, values=data, color='red')

    assert box.q1 == 106
    assert box.q2 == 109
    assert box.q3 == 113.5
    assert box.iqr == 7.5

    # test Interquartile range do not exceed data limits
    assert box.w0 == 102
    assert box.w1 == 118


def test_bar_single_value():
    data=[500]

    for stat in stats.keys():
        bar = BarGlyph(label={'cat': 'a'}, values=data, color='red', agg='sum')

        assert bar.get_start() == 0
        if stats != 'count':
            assert bar.get_end() == 500
        else:
            assert bar.get_end() == 1
