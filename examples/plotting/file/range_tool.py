import numpy as np

from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, RangeTool
from bokeh.plotting import figure
from bokeh.sampledata.stocks import AAPL

dates = np.array(AAPL['date'], dtype=np.datetime64)
source = ColumnDataSource(data=dict(date=dates, close=AAPL['adj_close']))

p = figure(plot_height=300, plot_width=800, tools="", toolbar_location=None,
           x_axis_type="datetime", x_range=(dates[1500], dates[2500]))

p.line('date', 'close', source=source)
p.yaxis.axis_label = 'Price'

select = figure(plot_height=150, plot_width=800, y_range=p.y_range,
                x_axis_type="datetime", y_axis_type=None,
                tools="", toolbar_location=None)

range_rool = RangeTool(x_range=p.x_range)
range_rool.overlay.fill_color = "navy"
range_rool.overlay.fill_alpha = 0.2

select.line('date', 'close', source=source)
select.ygrid.grid_line_color = None
select.add_tools(range_rool)
select.toolbar.active_multi = range_rool

show(column(p, select))
