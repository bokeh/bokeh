import numpy as np
import pandas as pd
from bokeh.plotting import *
from bokeh.objects import HoverTool
from bokeh.sampledata.unemployment1948 import data
from collections import OrderedDict

# Read in the data with pandas. Convert the year column to string
data['Year'] = [str(x) for x in data['Year']]
years = list(data['Year'])
months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
data = data.set_index('Year')

# this is the colormap from the original plot
colors = [
    "#75968f", "#a5bab7", "#c9d9d3", "#e2e2e2", "#dfccce",
    "#ddb7b1", "#cc7878", "#933b41", "#550b1d"
]

# Set up the data for plotting. We will need to have values for every
# pair of year/month names. Map the rate to a color.
month = []
year = []
color = []
rate = []
for y in years:
    for m in months:
        month.append(m)
        year.append(y)
        monthly_rate = data[m][y]
        rate.append(monthly_rate)
        color.append(colors[min(int(monthly_rate)-2, 8)])

# EXERCISE: create a `ColumnDataSource` with columns: month, year, color, rate

# EXERCISE: output to static HTML file

# EXERCISE: create a new figure

# EXERCISE: use the `rect renderer with the following attributes:
#   - x_range is years, y_range is months (reversed)
#   - fill color for the rectangles is the 'color' field
#   - line_color for the rectangles is None
#   - tools are resize and hover tools
#   - add a nice title, and set the plot_width and plot_height
rect('year', 'month', 0.95, 0.95, source=source,
     x_range=years, y_range=list(reversed(months)),
     color=
     line_color=
     tools=
     title=
     plot_width=
     plot_height=
)

# EXERCISE: use grid(), axis(), etc. to style the plot. Some suggestions:
#   - remove the axis and grid lines
#   - remove the major ticks
#   - make the tick labels smaller
#   - set the x-axis orientation to vertical, or angled

# EXERCISE: configure the  hover tool to display the month, year and rate
hover = [t for t in curplot().tools if isinstance(t, HoverTool)][0]
hover.tooltips = OrderedDict([
    # fill me in
])

show()      # show the plot