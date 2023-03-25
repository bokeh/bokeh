''' Animated contour plot.

Use the ``bokeh serve`` command to run the example by executing:

    bokeh serve contour_animated.py

at your command prompt. Then navigate to the URL

    http://localhost:5006/contour_animated

in your browser.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.contour, bokeh.models.ContourRenderer, bokeh.models.contour.contour_data
    :refs: :ref:`ug_topics_contour_animated`
    :keywords: contour

'''
import numpy as np

from bokeh.driving import count
from bokeh.palettes import PiYG
from bokeh.plotting import curdoc, figure
from bokeh.plotting.contour import contour_data

x, y = np.meshgrid(np.linspace(-1, 1, 41), np.linspace(-1, 1, 41))
levels = np.linspace(-1.0, 1.0, 11)

def get_z(timestep):
    delta = 0.08*np.cos(timestep*0.15)
    amps  = [0.95, 0.95, -0.95, -0.95]
    xmids = [-0.4,  0.4, -0.4,  0.4]
    ymids = [-0.4,  0.4,  0.4, -0.4]
    rads  = [0.4 + delta, 0.4 + delta, 0.4 - delta, 0.4 - delta]

    z = np.zeros_like(x)
    for amp, xmid, ymid, rad in zip(amps, xmids, ymids, rads):
        z += amp*np.exp( -((x-xmid)**2 + (y-ymid)**2)/rad**2 )
    return z

@count()
def callback(timestep):
    z = get_z(timestep)
    new_contour_data = contour_data(x, y, z, levels)
    contour_renderer.set_data(new_contour_data)

fig = figure(width=600, height=450)

contour_renderer = fig.contour(x, y, get_z(0), levels, fill_color=PiYG,
                               line_color="black", line_width=[1]*5 + [3] + [1]*5)

colorbar = contour_renderer.construct_color_bar()
fig.add_layout(colorbar, 'right')

curdoc().add_periodic_callback(callback, 40)
curdoc().add_root(fig)
