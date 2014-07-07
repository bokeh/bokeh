import json
import numpy as np
from bokeh.plotting import *
from bokeh.objects import ColumnDataSource

olympics = json.load(open('../data/olympics.json'))
data = { d['abbr']: d['medals'] for d in olympics['data'] if d['medals']['total'] > 0}

# pull out just the data we care about
countries = sorted(
    [d['abbr'] for d in olympics['data'] if d['medals']['total'] > 0],
    key=lambda x: data[x]['total'], reverse=True
)
gold = np.array([data[abbr]['gold'] for abbr in countries], dtype=np.float)
silver = np.array([data[abbr]['silver'] for abbr in countries], dtype=np.float)
bronze = np.array([data[abbr]['bronze'] for abbr in countries], dtype=np.float)

# EXERCISE: output static HTML file

# EXERCISE: turn on plot hold

# use the `rect` renderer to display stacked bars of the medal results. Note
# that we set y_range explicitly on the first renderer
rect(x=countries, y=bronze/2, width=0.8, height=bronze, x_range=countries, color="#CD7F32", alpha=0.6,
     background_fill='#59636C', title="Olympic Medals by Country (stacked)", tools="",
     y_range=[0, end=max(gold+silver+bronze)], plot_width=800)
rect(x=countries, y=bronze+silver/2, width=0.8, height=silver, x_range=countries, color="silver", alpha=0.6)

# EXERCISE: add a `rect` renderer to stack the gold medal results

# EXERCISE: use grid(), axis(), etc. to style the plot. Some suggestions:
#   - remove the grid lines
#   - change the major label standoff, and major_tick_out values
#   - make the tick labels smaller
#   - set the x-axis orientation to vertical, or angled

# EXERCISE: create a new figure

# Categorical percentage coordinates can be used for positioning/grouping
countries_bronze = [c+":0.3" for c in countries]
countries_silver = [c+":0.5" for c in countries]
countries_gold = [c+":0.7" for c in countries]

# EXERCISE: re create the medal plot, but this time:
#   - do not stack the bars on the y coordinate
#   - use countries_gold, etc. to positions the bars on the x coordinate

# EXERCISE: use grid(), axis(), etc. to style the plot. Some suggestions:
#   - remove the axis and grid lines
#   - remove the major ticks
#   - make the tick labels smaller
#   - set the x-axis orientation to vertical, or angled
xaxis().major_label_standoff = 6
xaxis().major_tick_out = 0

show()      # show the plot
