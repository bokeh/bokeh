from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import  Plot, ColorBar, LogTicker, Range1d, LinearColorMapper, LogColorMapper, Column

WIDTH = 600
HEIGHT = 600

def create_vertical_color_bar_with_log_cmap(height='auto', width='auto'):
    color_mapper = LogColorMapper(low=1, high=100000, palette='Viridis256')
    color_bar = ColorBar(orientation='vertical',
                         color_mapper=color_mapper,
                         height=height,
                         width=width,
                         ticker=LogTicker(),
                         label_standoff=12)
    return color_bar

def create_horizontal_color_bar_with_linear_cmap(height='auto', width='auto'):
    color_mapper = LinearColorMapper(low=0, high=100, palette='Spectral10')
    color_bar = ColorBar(orientation='horizontal',
                         color_mapper=color_mapper,
                         height=height,
                         width=width)
    return color_bar

def test_color_bar_placement_and_render():
    plot = Plot(width=WIDTH, height=HEIGHT,
                x_range=Range1d(0,10), y_range=Range1d(0,10),
                toolbar_location=None)

    bar_vertical_right_panel = create_vertical_color_bar_with_log_cmap()
    bar_vertical_right_panel.location = (0, 0)

    bar_vertical_in_frame = create_vertical_color_bar_with_log_cmap()
    bar_vertical_in_frame.location = "top_right"
    bar_vertical_in_frame.title = "Dummy Title"
    bar_vertical_in_frame.title_standoff = 7

    bar_horizontal_below_panel = create_horizontal_color_bar_with_linear_cmap()
    bar_horizontal_below_panel.location = (0, 0)

    bar_horizontal_in_frame = create_horizontal_color_bar_with_linear_cmap()
    bar_horizontal_in_frame.location = "bottom_left"
    bar_horizontal_in_frame.title = "Dummy Title"

    plot.add_layout(bar_vertical_right_panel, 'right')
    plot.add_layout(bar_vertical_in_frame)
    plot.add_layout(bar_horizontal_below_panel, 'below')
    plot.add_layout(bar_horizontal_in_frame)

    return plot

def test_color_bar_with_scale_alpha():
    plot = Plot(width=WIDTH, height=HEIGHT,
                x_range=Range1d(0,10), y_range=Range1d(0,10),
                outline_line_alpha=0.0, toolbar_location=None)

    bar_vertical_in_frame = create_vertical_color_bar_with_log_cmap()
    bar_vertical_in_frame.scale_alpha = 0.5

    plot.add_layout(bar_vertical_in_frame)

    return plot

layout = Column(children=[
    test_color_bar_placement_and_render(),
    test_color_bar_with_scale_alpha(),
])
save(layout)
