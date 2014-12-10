import numpy as np

from bokeh.plotting import figure, output_file, show, VBox
from bokeh.sampledata.olympics2014 import data

data = { d['abbr']: d['medals'] for d in data['data'] if d['medals']['total'] > 0}

# pull out just the data we care about
countries = sorted(
                   data.keys(),
    key=lambda x: data[x]['total'], reverse=True
)
gold = np.array([data[abbr]['gold'] for abbr in countries], dtype=np.float)
silver = np.array([data[abbr]['silver'] for abbr in countries], dtype=np.float)
bronze = np.array([data[abbr]['bronze'] for abbr in countries], dtype=np.float)

# EXERCISE: output static HTML file

# create a figure()
p1 = figure(title="Olympic Medals by Country (stacked)", tools="",
            x_range=countries, y_range=[0, max(gold+silver+bronze)],
            background_fill='#59636C', plot_width=800
    )

# use the `rect` renderer to display stacked bars of the medal results. Note
# that we set y_range explicitly on the first renderer
p1.rect(x=countries, y=bronze/2, width=0.8, height=bronze, color="#CD7F32", alpha=0.6)
p1.rect(x=countries, y=bronze+silver/2, width=0.8, height=silver, color="silver", alpha=0.6)

# EXERCISE: add a `rect` renderer to stack the gold medal results

# EXERCISE: use grid(), axis(), etc. to style the plot. Some suggestions:
#   - remove the grid lines
#   - change the major label standoff, and major_tick_out values
#   - make the tick labels smaller
#   - set the x-axis orientation to vertical, or angled

# create a new figure
p2 = figure(title="Olympic Medals by Country (grouped)", tools="",
            x_range=countries, y_range=[0, max([gold.max(), silver.max(), bronze.max()])],
            background_fill='#59636C', plot_width=1000, plot_height=300)

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

# show the plots arrayed in a VBox
show(VBox(p1, p2))
