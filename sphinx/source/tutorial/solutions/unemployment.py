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
source = ColumnDataSource(
    data=dict(
        month=month,
        year=year,
        color=color,
        rate=rate,
    )
)

# EXERCISE: output to static HTML file
output_file('unemployment.html')

# EXERCISE: create a new figure
figure()

# EXERCISE: use the `rect renderer with the following attributes:
#   - x_range is years, y_range is months (reversed)
#   - fill color for the rectangles is the 'color' field
#   - line_color for the rectangles is None
#   - tools are resize and hover tools
#   - add a nice title, and set the plot_width and plot_height
rect('year', 'month', 0.95, 0.95, source=source,
     x_axis_location="above",
     x_range=years, y_range=list(reversed(months)),
     color='color', line_color=None,
     tools="resize,hover", title="US Unemployment (1948 - 2013)",
     plot_width=900, plot_height=400)

# EXERCISE: use grid(), axis(), etc. to style the plot. Some suggestions:
#   - remove the axis and grid lines
#   - remove the major ticks
#   - make the tick labels smaller
#   - set the x-axis orientation to vertical, or angled
grid().grid_color = None
axis().axis_color = None
axis().major_tick_color = None
axis().major_label_font_size = "5pt"
axis().major_label_standoff = 0
xaxis().major_label_orientation = np.pi/3

# EXERCISE: configure the  hover tool to display the month, year and rate
hover = curplot().select(dict(type=HoverTool))
hover.tooltips = OrderedDict([
    ('date', '@month @year'),
    ('rate', '@rate'),
])

show()      # show the plot
