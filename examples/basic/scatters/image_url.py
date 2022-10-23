import numpy as np

from bokeh.core.properties import value
from bokeh.plotting import figure, show

url = "https://static.bokeh.org/logos/logo.png"
x = np.random.random(150) * 100
y = np.random.random(150) * 100

p = figure(match_aspect=True, toolbar_location=None,
           background_fill_color="#efefef")

# value is used here to prevent the string URL from being
# interpreted as a column name from the data source.
p.image_url(url=value(url), x=x, y=y, alpha=0.7, anchor="center",
            w=18, w_units="screen", h=18, h_units="screen")

show(p)
