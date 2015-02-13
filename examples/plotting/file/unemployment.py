from collections import OrderedDict

import numpy as np

from bokeh.plotting import *
from bokeh.models import HoverTool
from bokeh.sampledata.unemployment1948 import data

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

source = ColumnDataSource(
    data=dict(month=month, year=year, color=color, rate=rate)
)

output_file('unemployment.html')

TOOLS = "resize,hover,save,pan,box_zoom,wheel_zoom"

p = figure(title="US Unemployment (1948 - 2013)",
    x_range=years, y_range=list(reversed(months)),
    x_axis_location="above", plot_width=900, plot_height=400,
    toolbar_location="left", tools=TOOLS)

p.rect("year", "month", 1, 1, source=source,
    color="color", line_color=None)

p.grid.grid_line_color = None
p.axis.axis_line_color = None
p.axis.major_tick_line_color = None
p.axis.major_label_text_font_size = "5pt"
p.axis.major_label_standoff = 0
p.xaxis.major_label_orientation = np.pi/3

hover = p.select(dict(type=HoverTool))
hover.snap_to_data = False
hover.tooltips = OrderedDict([
    ('date', '@month @year'),
    ('rate', '@rate'),
])

show(p)      # show the plot
