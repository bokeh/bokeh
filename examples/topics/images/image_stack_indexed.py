''' A plot that color maps one 2D array of a 3D image stack at a time.

The data is a 3D array of shape ``(ny, nx, nt)`` holding the temperature of a
plate at ``nt`` times, as heat spreads out from three sources. The
``IndexedStackColorMapper`` color maps the 2D array at its ``index`` with its
``single_color_mapper``, which the color bar also draws. The slider changes
``index``, and the checkbox sets ``scan_all``, so that the color mapping limits
come from scanning the whole 3D array rather than just the 2D array displayed.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.image_stack, bokeh.models.IndexedStackColorMapper, bokeh.models.ColorBar, bokeh.models.Slider, bokeh.models.Checkbox
    :refs: :ref:`ug_topics_images`
    :keywords: image, image_stack, colormap, slider

'''
import numpy as np

from bokeh.layouts import column
from bokeh.models import Checkbox, IndexedStackColorMapper, LinearColorMapper, Slider
from bokeh.plotting import figure, show

# Each 2D array is a sum of Gaussians that spread out and flatten over time.
x = np.linspace(0, 4, 100)
y = np.linspace(0, 3, 75)
t = np.linspace(0.02, 0.5, 16)
xx, yy, tt = np.meshgrid(x, y, t)  # each of shape (ny, nx, nt)

sources = [(1.0, 1.0, 1.0), (2.6, 2.0, 0.6), (3.1, 0.8, 0.8)]  # x, y, strength
data = sum(
    strength*np.exp(-((xx - x0)**2 + (yy - y0)**2)/(4*tt))/(4*np.pi*tt)
    for x0, y0, strength in sources
)

color_mapper = IndexedStackColorMapper(single_color_mapper=LinearColorMapper(palette="Inferno256"))

p = figure(width=600, height=450, x_range=(0, 4), y_range=(0, 3),
           title="Heat spreading out from three sources")
r = p.image_stack(image=[data], x=0, y=0, dw=4, dh=3, color_mapper=color_mapper)

color_bar = r.construct_color_bar(title="Temperature")
p.add_layout(color_bar, "right")

slider = Slider(start=0, end=len(t) - 1, value=0, step=1, title="Time step")
slider.js_link("value", color_mapper, "index")

checkbox = Checkbox(label="Use the same color mapping for all time steps")
checkbox.js_link("active", color_mapper, "scan_all")

show(column(p, slider, checkbox))
