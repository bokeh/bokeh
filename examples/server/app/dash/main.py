''' A dashboard that utilizes `Auto MPG`_ and stocks dataset.
This example demonstrates the use of Bootstrap templates to compile several types
of charts in one file.

.. note::
    This example needs the Pandas package to run.

.. _Auto MPG: https://archive.ics.uci.edu/ml/datasets/auto+mpg

'''
from collections import Counter
from math import pi

import numpy as np
import pandas as pd

from bokeh.io import curdoc
from bokeh.layouts import column
from bokeh.models import (ColumnDataSource, DataTable, NumberFormatter,
                          RangeTool, StringFormatter, TableColumn)
from bokeh.palettes import Spectral11
from bokeh.plotting import figure
from bokeh.sampledata.autompg2 import autompg2 as mpg
from bokeh.sampledata.stocks import AAPL
from bokeh.transform import cumsum

# Timeseries

dates = np.array(AAPL['date'], dtype=np.datetime64)
source = ColumnDataSource(data=dict(date=dates, close=AAPL['adj_close']))

p = figure(height=180, tools="", toolbar_location=None,  # name="line",
           x_axis_type="datetime", x_range=(dates[1500], dates[2500]), sizing_mode="stretch_width")

p.line('date', 'close', source=source, line_width=2, alpha=0.7)
p.yaxis.axis_label = 'Traffic'
p.background_fill_color = "#f5f5f5"
p.grid.grid_line_color = "white"

select = figure(height=90, width=800, y_range=p.y_range,
                x_axis_type="datetime", y_axis_type=None,
                tools="", toolbar_location=None, sizing_mode="stretch_width")

range_rool = RangeTool(x_range=p.x_range)
range_rool.overlay.fill_color = "navy"
range_rool.overlay.fill_alpha = 0.2

select.line('date', 'close', source=source)
select.ygrid.grid_line_color = None
select.add_tools(range_rool)
select.background_fill_color = "#f5f5f5"
select.grid.grid_line_color = "white"
select.x_range.range_padding = 0.01

layout = column(p, select, sizing_mode="stretch_both", name="line")

curdoc().add_root(layout)

# Donut chart

x = Counter({'United States': 157, 'United Kingdom': 93, 'Japan': 89, 'China': 63,
             'Germany': 44, 'India': 42, 'Italy': 40, 'Australia': 35, 'Brazil': 32,
             'France': 31, 'Taiwan': 31})

data = pd.DataFrame.from_dict(dict(x), orient='index').reset_index().rename(index=str,
                                                                            columns={0: 'value', 'index': 'country'})
data['angle'] = data['value']/sum(x.values()) * 2*pi
data['color'] = Spectral11

region = figure(height=350, toolbar_location=None, outline_line_color=None, sizing_mode="scale_both", name="region",
                tools='hover', tooltips=[('country', "@country"), ("value", "@value")], x_range=(-0.4, 1))

region.annular_wedge(x=-0, y=1, inner_radius=0.2, outer_radius=0.32,
                     start_angle=cumsum('angle', include_zero=True), end_angle=cumsum('angle'),
                     line_color="white", fill_color='color', legend_group='country', source=data, name='test')

region.toolbar.active_drag = None
region.axis.axis_label = None
region.axis.visible = False
region.grid.grid_line_color = None
region.legend.label_text_font_size = "0.7em"
region.legend.spacing = 1
region.legend.glyph_height = 15
region.legend.label_height = 15

curdoc().add_root(region)

# Bar chart

plats = ("IOS", "Android", "OSX", "Windows", "Other")
values = (35, 22, 13, 26, 4)
platform = figure(height=350, toolbar_location=None, outline_line_color=None, sizing_mode="scale_both", name="platform",
                  y_range=list(reversed(plats)), x_axis_location="above")
platform.toolbar.active_drag = None
platform.x_range.start = 0
platform.ygrid.grid_line_color = None
platform.axis.minor_tick_line_color = None
platform.outline_line_color = None

platform.hbar(left=0, right=values, y=plats, height=0.8)

curdoc().add_root(platform)

# Table

source = ColumnDataSource(data=mpg[:6])
columns = [
    TableColumn(field="cyl", title="Counts"),
    TableColumn(field="cty", title="Uniques",
                formatter=StringFormatter(text_align="center")),
    TableColumn(field="hwy", title="Rating",
                formatter=NumberFormatter(text_align="right")),
]
table = DataTable(source=source, columns=columns, height=210, width=330, name="table", sizing_mode="stretch_width")

curdoc().add_root(table)

# Setup

curdoc().title = "Bokeh Dashboard"
curdoc().template_variables['stats_names'] = ['users', 'new_users', 'time', 'sessions', 'sales']
curdoc().template_variables['stats'] = {
    'users'     : {'icon': 'user',        'value': 11200, 'change':  4  , 'label': 'Total Users'},
    'new_users' : {'icon': 'user',        'value': 350,   'change':  1.2, 'label': 'New Users'},
    'time'      : {'icon': 'clock-o',     'value': 5.6,   'change': -2.3, 'label': 'Total Time'},
    'sessions'  : {'icon': 'user',        'value': 27300, 'change':  0.5, 'label': 'Total Sessions'},
    'sales'     : {'icon': 'dollar-sign', 'value': 8700,  'change': -0.2, 'label': 'Average Sales'},
}
