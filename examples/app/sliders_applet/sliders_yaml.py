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

def compute_y(amplitude=1, offset=0, phase=1, freq=0, **kws):
    return amplitude * np.sin(freq*x + phase) + offset

def update_data(app):
    """Called each time that any watched property changes.

    This updates the sin wave data using the sliders updated values.
    """
    # Get the source and update its data
    source = app.select_one({'tags': 'source'})
    source.data = {'x': x, 'y': compute_y(**app._values)}


sliders_app = bokeh_app(os.path.join(here, 'sliders.yaml'), route='/sliders', handler=update_data,
                        theme=os.path.join(here, 'style.yaml'))
sliders_app.sources['source'].data = {'x': x, 'y': compute_y(**sliders_app._values)}

print ("Access the demo at: http://127.0.0.1:5006/sliders")
