# Import the necessary modules
import numpy as np
from bokeh.core.properties import value
from bokeh.plotting import figure, show

# Set the URL and generate random x and y data
url = "https://static.bokeh.org/logos/logo.png"
x = np.random.random(150) * 100
y = np.random.random(150) * 100

# Create a figure with a specified aspect ratio, no toolbar, and a light gray background
# Also add a title and label the x and y axes
p = figure(match_aspect=True, toolbar_location=None,
           background_fill_color="#efefef",title="image_url",
           x_axis_label="X Axis Label", y_axis_label="Y Axis Label")

# Add an image to the plot using the specified URL
# The 'value' parameter is used to prevent the string URL from being interpreted as a column name from the data source
# The 'w' and 'h' parameters specify the width and height of the image in screen units
p.image_url(url=value(url), x=x, y=y, alpha=0.7, anchor="center",
            w=18, w_units="screen", h=18, h_units="screen")

# Display the plot
show(p)
