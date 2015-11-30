from bokeh.plotting import figure, show
from bokeh.models import LinearColorMapper, LinearColorMapperReplacement, SegmentedColorMapper
from bokeh.io import output_file
from bokeh.colors import *
import numpy as np
output_file('LinearColorMapperExample.html')

# Generate a set of sample data to plot (nothing like a mountain!)
xs = np.linspace(-10, 10, 200)
ys = np.linspace(-10, 10, 200)
ys = ys[:,np.newaxis]
z = np.matrix(np.exp(-4*np.log(2)*((xs - 0)**2 + (ys-0)**2) / 80))

# Create the LinearColorMapper instance described in the text
# lcmap = LinearColorMapperReplacement(
#     palette = [black, white],
#     low = 0,
#     high = 1
# )

lcmap = SegmentedColorMapper(palette = ['black', 'white'])

# Generate the plot
p = figure(plot_width = 300, plot_height = 300, x_range = [-10,10], y_range = [-10,10])
p.image(image = [z], x = [-10], y = [-10], dw = [20], dh = [20], color_mapper = lcmap)

show(p)
