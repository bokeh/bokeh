"""
This file demonstrates a bokeh applet, which can be viewed directly
on a bokeh-server. See the README.md file in this directory for
instructions on running.
"""
from __future__ import print_function

import logging
import os
logging.basicConfig(level=logging.DEBUG)

import numpy as np
from bokeh.appmaker import bokeh_app

N = 200
x = np.linspace(0, 4*np.pi, N)
here = os.path.dirname(os.path.abspath(__file__))

def update_data(app):
    """Called each time that any watched property changes.

    This updates the sin wave data with the most recent values of the
    sliders. This is stored as two numpy arrays in a dict into the app's
    data source property.
    """
    # Get the current slider values
    a = app.objects['amplitude'].value
    b = app.objects['offset'].value
    w = app.objects['phase'].value
    k = app.objects['freq'].value
    title = app.objects['title'].value
    plot = app.objects['plot']
    source = app.select_one({'tags': 'source'})

    # Generate the sine wave
    y = a*np.sin(k*x + w) + b

    logging.debug("PARAMS: offset: %s amplitude: %s", b, a)
    source.data = dict(x=x, y=y)
    plot.title = title

    return {'plot': plot}

sliders_app = bokeh_app(os.path.join(here, 'sliders.yaml'), route='/sliders', handler=update_data)
sliders_app.sources['source'].data = {'x': x, 'y': 1.*np.sin(1.*x)}
