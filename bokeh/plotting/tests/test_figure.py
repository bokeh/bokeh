from __future__ import absolute_import
import pytest

from bokeh.core.properties import value
from bokeh.models import (
    BoxZoomTool,
    ColumnDataSource,
    LassoSelectTool,
    Legend,
    LinearAxis,
    LogScale,
    PanTool,
    ResetTool,
    Title,
)

import bokeh.plotting as plt

class TestFigure(object):

    def test_basic(self):
        p = plt.figure()
        q = plt.figure()
        q.circle([1, 2, 3], [1, 2, 3])
        assert p != q

        r = plt.figure()
        assert p != r
        assert q != r

        p = plt.figure(width=100, height=120)
        assert p.plot_width == 100
        assert p.plot_height == 120

        p = plt.figure(plot_width=100, plot_height=120)
        assert p.plot_width == 100
        assert p.plot_height == 120

        with pytest.raises(ValueError):
            plt.figure(plot_width=100, width=120)

        with pytest.raises(ValueError):
            plt.figure(plot_height=100, height=120)

    def test_xaxis(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        assert len(p.xaxis) == 1

        expected = set(p.xaxis)

        ax = LinearAxis()
        expected.add(ax)
        p.above.append(ax)
        assert set(p.xaxis) == expected

        ax2 = LinearAxis()
        expected.add(ax2)
        p.above.append(ax2)
        assert set(p.xaxis) == expected

        p.left.append(LinearAxis())
        assert set(p.xaxis) == expected

        p.right.append(LinearAxis())
        assert set(p.xaxis) == expected

    def test_yaxis(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        assert len(p.yaxis) == 1

        expected = set(p.yaxis)

        ax = LinearAxis()
        expected.add(ax)
        p.right.append(ax)
        assert set(p.yaxis) == expected

        ax2 = LinearAxis()
        expected.add(ax2)
        p.right.append(ax2)
        assert set(p.yaxis) == expected

        p.above.append(LinearAxis())
        assert set(p.yaxis) == expected

        p.below.append(LinearAxis())
        assert set(p.yaxis) == expected

    def test_axis(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        assert len(p.axis) == 2

        expected = set(p.axis)

        ax = LinearAxis()
        expected.add(ax)
        p.above.append(ax)
        assert set(p.axis) == expected

        ax2 = LinearAxis()
        expected.add(ax2)
        p.below.append(ax2)
        assert set(p.axis) == expected

        ax3 = LinearAxis()
        expected.add(ax3)
        p.left.append(ax3)
        assert set(p.axis) == expected

        ax4 = LinearAxis()
        expected.add(ax4)
        p.right.append(ax4)
        assert set(p.axis) == expected

    def test_log_axis(self):
        p = plt.figure(x_axis_type='log')
        p.circle([1, 2, 3], [1, 2, 3])
        assert isinstance(p.x_scale, LogScale)

        p = plt.figure(y_axis_type='log')
        p.circle([1, 2, 3], [1, 2, 3])
        assert isinstance(p.y_scale, LogScale)

    def test_xgrid(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        assert len(p.xgrid) == 1
        assert p.xgrid[0].dimension == 0

    def test_ygrid(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        assert len(p.ygrid) == 1
        assert p.ygrid[0].dimension == 1

    def test_grid(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3])
        assert len(p.grid) == 2

    def test_tools(self):
        TOOLS = "pan,box_zoom,reset,lasso_select"
        fig = plt.figure(tools=TOOLS)
        expected = [PanTool, BoxZoomTool, ResetTool, LassoSelectTool]

        assert len(fig.tools) == len(expected)
        for i, _type in enumerate(expected):
            assert isinstance(fig.tools[i], _type)

    def test_plot_fill_props(self):
        p = plt.figure(background_fill_color='red',
                       background_fill_alpha=0.5,
                       border_fill_color='blue',
                       border_fill_alpha=0.8)
        assert p.background_fill_color == 'red'
        assert p.background_fill_alpha == 0.5
        assert p.border_fill_color == 'blue'
        assert p.border_fill_alpha == 0.8

        p.background_fill_color = 'green'
        p.border_fill_color = 'yellow'
        assert p.background_fill_color == 'green'
        assert p.border_fill_color == 'yellow'

    def test_columnsource_auto_conversion_from_dict(self):
        p = plt.figure()
        dct = {'x': [1, 2, 3], 'y': [2, 3, 4]}
        p.circle(x='x', y='y', source=dct)

    def test_columnsource_auto_conversion_from_pandas(self, pd):
        p = plt.figure()
        df = pd.DataFrame({'x': [1, 2, 3], 'y': [2, 3, 4]})
        p.circle(x='x', y='y', source=df)


class TestMarkers(object):

    def check_each_color_input(self, rgbs, func):
        """Runs assertions for each rgb provided with the given function."""
        for rgb in rgbs:
            p = plt.figure()
            func(p, rgb)

    def color_only_checks(self, p, rgb):
        """Helper method for checks specific to color= input."""
        p.circle([1, 2, 3], [1, 2, 3], color=rgb)
        assert p.renderers[-1].glyph.line_color == rgb
        assert p.renderers[-1].glyph.fill_color == rgb

        # rgb should always be an integer by the time it is added to property
        for v in p.renderers[-1].glyph.line_color[0:3]:
            assert isinstance(v, int)
            assert isinstance(v, int)

    def line_color_input_checks(self, p, rgb):
        """Helper method for checks specific to line_color= only input."""
        p.circle([1, 2, 3], [1, 2, 3], line_color=rgb)
        assert p.renderers[-1].glyph.line_color == rgb
        # should always be an integer by the time it is added to property
        for v in p.renderers[-1].glyph.line_color[0:3]:
            assert isinstance(v, int)

    def test_mixed_inputs(self):
        """Helper method to test mixed global and specific color args."""

        p = plt.figure()
        rgb = (100, 0, 0)
        rgb_other = (0, 100, 0)
        alpha1 = 0.5
        alpha2 = 0.75

        # color/line_color
        p.circle([1, 2, 3], [1, 2, 3], color=rgb, line_color=rgb_other)
        assert p.renderers[-1].glyph.fill_color == rgb
        assert p.renderers[-1].glyph.line_color == rgb_other

        # color/fill_color
        p.circle([1, 2, 3], [1, 2, 3], color=rgb, fill_color=rgb_other)
        assert p.renderers[-1].glyph.line_color == rgb
        assert p.renderers[-1].glyph.fill_color == rgb_other

        # alpha/line_alpha
        p.circle([1, 2, 3], [1, 2, 3], color=rgb, alpha=alpha1,
                 line_alpha=alpha2)
        assert p.renderers[-1].glyph.line_alpha == alpha2
        assert p.renderers[-1].glyph.fill_alpha == alpha1

    def test_color_input_float(self):
        """Test input of rgb with float values."""
        rgbs = [(100., 100., 100.), (50., 100., 50., 0.5)]
        self.check_each_color_input(rgbs=rgbs, func=self.color_only_checks)
        self.check_each_color_input(rgbs=rgbs, func=self.line_color_input_checks)

    def test_color_input_int(self):
        """Test input of rgb with integers."""
        rgbs = [(100, 100, 100), (50, 100, 50, 0.5)]
        self.check_each_color_input(rgbs=rgbs, func=self.color_only_checks)
        self.check_each_color_input(rgbs=rgbs, func=self.line_color_input_checks)

    def test_render_level(self):
        p = plt.figure()
        p.circle([1, 2, 3], [1, 2, 3], level="underlay")
        assert p.renderers[-1].level == "underlay"
        with pytest.raises(ValueError):
            p.circle([1, 2, 3], [1, 2, 3], level="bad_input")


def test_hbar_stack_returns_renderers():
    fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
    years = ["2015", "2016", "2017"]
    colors = ["#c9d9d3", "#718dbf", "#e84d60"]
    data = {'fruits' : fruits,
        '2015'   : [2, 1, 4, 3, 2, 4],
        '2016'   : [5, 3, 4, 2, 4, 6],
        '2017'   : [3, 2, 4, 4, 5, 3]}
    source = ColumnDataSource(data=data)

    p = plt.figure()
    renderers = p.hbar_stack(years, y='fruits', height=0.9, color=colors, source=source,
                         legend=[value(x) for x in years], name=years)
    assert len(renderers) == 3
    assert renderers[0].name == "2015"
    assert renderers[1].name == "2016"
    assert renderers[2].name == "2017"

def test_vbar_stack_returns_renderers():
    fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
    years = ["2015", "2016", "2017"]
    colors = ["#c9d9d3", "#718dbf", "#e84d60"]
    data = {'fruits' : fruits,
        '2015'   : [2, 1, 4, 3, 2, 4],
        '2016'   : [5, 3, 4, 2, 4, 6],
        '2017'   : [3, 2, 4, 4, 5, 3]}
    source = ColumnDataSource(data=data)

    p = plt.figure()
    renderers = p.vbar_stack(years, x='fruits', width=0.9, color=colors, source=source,
                         legend=[value(x) for x in years], name=years)
    assert len(renderers) == 3
    assert renderers[0].name == "2015"
    assert renderers[1].name == "2016"
    assert renderers[2].name == "2017"

def test_title_kwarg_no_warning(recwarn):
    plt.figure(title="title")
    assert len(recwarn) == 0


def test_figure_title_should_accept_title():
    title = Title(text='Great Title')
    plot = plt.figure(title=title)
    plot.line([1, 2, 3], [1, 2, 3])
    assert plot.title.text == 'Great Title'


def test_figure_title_should_accept_string():
    plot = plt.figure(title='Great Title 2')
    plot.line([1, 2, 3], [1, 2, 3])
    assert plot.title.text == 'Great Title 2'


@pytest.fixture
def source():
    return ColumnDataSource(dict(x=[1, 2, 3], y=[1, 2, 3], label=['a', 'b', 'c']))


@pytest.fixture
def p():
    return plt.figure()


def test_glyph_label_is_legend_if_column_in_datasource_is_added_as_legend(p, source):
    p.circle(x='x', y='y', legend='label', source=source)
    legends = p.select(Legend)
    assert len(legends) == 1
    assert legends[0].items[0].label == {'field': 'label'}


def test_glyph_label_is_value_if_column_not_in_datasource_is_added_as_legend(p, source):
    p.circle(x='x', y='y', legend='milk', source=source)
    legends = p.select(Legend)
    assert len(legends) == 1
    assert legends[0].items[0].label == {'value': 'milk'}

def test_glyph_label_is_legend_if_column_in_df_datasource_is_added_as_legend(p, pd):
    source = pd.DataFrame(data=dict(x=[1, 2, 3], y=[1, 2, 3], label=['a', 'b', 'c']))
    p.circle(x='x', y='y', legend='label', source=source)
    legends = p.select(Legend)
    assert len(legends) == 1
    assert legends[0].items[0].label == {'field': 'label'}


def test_glyph_label_is_value_if_column_not_in_df_datasource_is_added_as_legend(p, pd):
    source = pd.DataFrame(data=dict(x=[1, 2, 3], y=[1, 2, 3], label=['a', 'b', 'c']))
    p.circle(x='x', y='y', legend='milk', source=source)
    legends = p.select(Legend)
    assert len(legends) == 1
    assert legends[0].items[0].label == {'value': 'milk'}

def test_glyph_label_is_just_added_directly_if_not_string(p, source):
    p.circle(x='x', y='y', legend={'field': 'milk'}, source=source)
    legends = p.select(Legend)
    assert len(legends) == 1
    assert legends[0].items[0].label == {'field': 'milk'}


def test_no_legend_if_legend_is_none(p, source):
    p.circle(x='x', y='y', legend=None, source=source)
    legends = p.select(Legend)
    assert len(legends) == 0


def test_legend_added_when_legend_set(p, source):
    renderer = p.circle(x='x', y='y', legend='label', source=source)
    legends = p.select(Legend)
    assert len(legends) == 1
    assert legends[0].items[0].renderers == [renderer]


def test_legend_not_added_when_no_legend(p, source):
    p.circle(x='x', y='y', source=source)
    legends = p.select(Legend)
    assert len(legends) == 0


def test_adding_legend_doesnt_work_when_legends_already_added(p, source):
    p.add_layout(Legend())
    p.add_layout(Legend())
    with pytest.raises(RuntimeError):
        p.circle(x='x', y='y', legend='label', source=source)


def test_multiple_renderers_correctly_added_to_legend(p, source):
    square = p.square(x='x', y='y', legend='square', source=source)
    circle = p.circle(x='x', y='y', legend='circle', source=source)
    legends = p.select(Legend)
    assert len(legends) == 1
    assert legends[0].items[0].renderers == [square]
    assert legends[0].items[0].label == value('square')
    assert legends[0].items[1].renderers == [circle]
    assert legends[0].items[1].label == value('circle')


def test_compound_legend_behavior_initiated_if_labels_are_same_on_multiple_renderers(p, source):
    # 'compound legend string' is just a value
    square = p.square(x='x', y='y', legend='compound legend string')
    circle = p.circle(x='x', y='y', legend='compound legend string')
    legends = p.select(Legend)
    assert len(legends) == 1
    assert legends[0].items[0].renderers == [square, circle]
    assert legends[0].items[0].label == {'value': 'compound legend string'}


def test_compound_legend_behavior_initiated_if_labels_are_same_on_multiple_renderers_and_are_field(p, source):
    # label is a field
    square = p.square(x='x', y='y', legend='label', source=source)
    circle = p.circle(x='x', y='y', legend='label', source=source)
    legends = p.select(Legend)
    assert len(legends) == 1
    assert legends[0].items[0].renderers == [square, circle]
    assert legends[0].items[0].label == {'field': 'label'}

# XXX (bev) this doesn't work yet because compound behaviour depends on renderer sources
# matching, but passing a df means every renderer gets its own new source
# def test_compound_legend_behavior_initiated_if_labels_are_same_on_multiple_renderers_and_are_field_with_df_source(p, pd):
#     source = pd.DataFrame(data=dict(x=[1, 2, 3], y=[1, 2, 3], label=['a', 'b', 'c']))
#     # label is a field
#     square = p.square(x='x', y='y', legend='label', source=source)
#     circle = p.circle(x='x', y='y', legend='label', source=source)
#     legends = p.select(Legend)
#     assert len(legends) == 1
#     print(legends[0].items[0].renderers)
#     assert legends[0].items[0].renderers == [square, circle]
#     assert legends[0].items[0].label == {'field': 'label'}
