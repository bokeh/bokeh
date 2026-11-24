''' A categorical heatmap using unemployment data. This example demonstrates
adding a ``ColorBar`` to a plot.

.. bokeh-example-metadata::
    :title: Unemployment heatmap
    :keywords: categorical, colorbar, heatmap, hover, tooltip
    :apis: bokeh.plotting.figure.rect, bokeh.models.ColorBar
    :sampledata: unemployment1948
    :refs: :ref:`ug_basic_annotations_color_bars`
    :gallery: A categorical heatmap of monthly US unemployment data from 1948 to 2016. The x-axis is years and the y-axis is month of the year.

'''
from math import pi

import pandas as pd

from bokeh.models import BasicTicker, PrintfTickFormatter
from bokeh.plotting import figure, show
from bokeh.sampledata.unemployment1948 import data
from bokeh.transform import linear_cmap

data['Year'] = data['Year'].astype(str)
data = data.set_index('Year')
data.drop('Annual', axis=1, inplace=True)
data.columns.name = 'Month'

years = list(data.index)
months = list(reversed(data.columns))

# reshape to 1D array or rates with a month and year for each row.
df = pd.DataFrame(data.stack(), columns=['rate']).reset_index()

# this is the colormap from the original NYTimes plot
colors = ["#75968f", "#a5bab7", "#c9d9d3", "#e2e2e2", "#dfccce", "#ddb7b1", "#cc7878", "#933b41", "#550b1d"]

TOOLS = "hover,save,pan,box_zoom,reset,wheel_zoom"

p = figure(title=f"US Unemployment ({years[0]} - {years[-1]})",
           x_range=years, y_range=months,
           x_axis_location="above", width=900, height=400,
           tools=TOOLS, toolbar_location='below',
           tooltips=[('date', '@Month @Year'), ('rate', '@rate%')])

p.grids.grid_line_color = None
p.axes.axis_line_color = None
p.axes.major_tick_line_color = None
p.axes.major_label_text_font_size = "7px"
p.axes.major_label_standoff = 0
p.xaxis.major_label_orientation = pi / 3

r = p.rect(x="Year", y="Month", width=1, height=1, source=df,
           fill_color=linear_cmap("rate", colors, low=df.rate.min(), high=df.rate.max()),
           line_color=None)

p.add_layout(r.construct_color_bar(
    major_label_text_font_size="7px",
    ticker=BasicTicker(desired_num_ticks=len(colors)),
    formatter=PrintfTickFormatter(format="%d%%"),
    label_standoff=6,
    border_line_color=None,
    padding=5,
), 'right')

show(p)
