''' A scatter plot showing `Bokeh image logo <https://static.bokeh.org/logos/logo.png>`__ as marker.

.. bokeh-example-metadata::
    :title: Use an image as a marker
    :keywords: image, scatter
    :apis: bokeh.plotting.figure.image_url
    :refs: :ref:`ug_basic_scatters_urls`
    :gallery: A scatter using an arbitrary image (in this case, the Bokeh logo) for the scatter marker.

'''
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
