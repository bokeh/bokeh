import numpy as np

from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Metric, RangeTool, ScaleBar
from bokeh.plotting import figure, show

n_points = 3000
x_values = np.linspace(0, 100, n_points)
y_values = np.random.randn(n_points).cumsum()

source = ColumnDataSource(data=dict(x=x_values, y=y_values))

detailed_plot = figure(
    width=800,
    height=300,
    tools=["xpan", "xzoom_in", "xzoom_out", "reset", "wheel_zoom"],
    toolbar_location="above",
    active_scroll="wheel_zoom",
    background_fill_color="#efefef",
    x_range=(22, 30),
    y_axis_location=None,
)

detailed_plot.line("x", "y", source=source)

scale_bar = ScaleBar(
    range=detailed_plot.y_range,
    unit="MeV",
    dimensional=Metric(base_unit="eV"),
    orientation="vertical",
    location="top_left",
    background_fill_color=None,
    border_line_color=None,
)
detailed_plot.add_layout(scale_bar)

select_plot = figure(
    width=detailed_plot.width,
    height=150,
    y_range=detailed_plot.y_range,
    y_axis_location=None,
    tools="",
    toolbar_location=None,
    background_fill_color=detailed_plot.background_fill_color,
)

select_plot.line("x", "y", source=source)
select_plot.x_range.range_padding = 0
select_plot.ygrid.grid_line_color = None

range_tool = RangeTool(x_range=detailed_plot.x_range)
range_tool.overlay.fill_color = "navy"
range_tool.overlay.fill_alpha = 0.2
select_plot.add_tools(range_tool)

show(column(detailed_plot, select_plot))
