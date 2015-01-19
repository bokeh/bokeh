import numpy as np

from bokeh.plotting import figure, output_file, show
from bokeh.palettes import brewer

# Define some categories
categories = [
    'ousia', 'poson', 'poion', 'pros ti', 'pou',
    'pote', 'keisthai', 'echein', 'poiein', 'paschein',
]

# Create data
N = 10
data = { cat : np.random.randint(10, 100, size=N) for cat in categories }

# Define a little function to stack series together to make polygons. Soon
# this will be built into Bokeh.
def stacked(data, categories):
    ys = []
    last = np.zeros(len(list(data.values())[0]))
    for cat in categories:
        next = last + data[cat]
        ys.append(np.hstack((last[::-1], next)))
        last = next
    return ys

# Get the y coordinates of the stacked data
ys = stacked(data, categories)

# The x coordinates for each polygon are simply the series concatenated
# with its reverse.
xs = [np.hstack((categories[::-1], categories))] * len(ys)

# Pick out a color palette
colors = brewer["Spectral"][len(ys)]

# EXERCISE: output static HTML file

# create a figure
p = figure(title="Categories of Brewering", background_fill="lightgrey",
           tools="resize,reset,save", x_range=categories, y_range=[0, 800])

# EXERCISE: play around with parameters like:
#   - line_color
#   - line_alpha
#   - line_width
#   - line_dash   (e.g., [2,4])
#   - fill_color
#   - fill_alpha

# EXERCISE: configure all of the following plot properties
p.ygrid.grid_line_color =
p.ygrid.grid_line_width =
p.axis.major_label_text_font_size =
p.axis.major_label_text_font_style =
p.axis.major_label_standoff =               # distance of tick labels from ticks
p.axis.axis_line_color =                    # color, or None, to suppress the line
p.xaxis.major_label_orientation =           # radians, "horizontal", "vertical", "normal"
p.xaxis.major_tick_in =                     # distance ticks extends into the plot
p.xaxis.major_tick_out =                    # and distance they extend out
p.xaxis.major_tick_line_color =

show(p)
