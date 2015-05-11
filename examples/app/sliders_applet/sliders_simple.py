"""
This file demonstrates a bokeh applet, which can be viewed directly
on a bokeh-server. See the README.md file in this directory for
instructions on running.
"""

import numpy as np

from bokeh.plotting import figure
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import AppHBox, AppVBoxForm,Slider, TextInput
from bokeh.simpleapp import simpleapp

N = 200

# Create a few widgets that will be used in our app.
#
# NOTE: Widgets can also be created inside the simpleapp decorated function
#       but if they are created globaly like in this case
title_widget = TextInput(title="title", name='title', value='my sine wave')
offset_widget = Slider(title="offset", name='offset', value=0.0,
                       start=-5.0, end=5.0, step=0.1)
amplitude_widget = Slider(title="amplitude", name='amplitude',
                          value=1.0, start=-5.0, end=5.0)
phase_widget = Slider(title="phase", name='phase', value=0.0, start=0.0, end=2*np.pi)
freq_widget = Slider(title="freq", name='freq', value=1.0, start=0.1, end=5.1)

# define a function that will create a plot object for us based on the
# a set of parameters
def create_plot(title, amplitude, offset, phase, freq):
    """ Create a plot object with a sin curve using received args
    """
    toolset = "crosshair,pan,reset,resize,save,wheel_zoom"
    plot = figure(
        title_text_font_size="12pt",
        height=400, width=400, tools=toolset,
        title=title, x_range=[0, 4*np.pi], y_range=[-2.5, 2.5]
    )
    # Plot the line by the x,y values in the source property
    x = np.linspace(0, 4*np.pi, N)
    y = amplitude*np.sin(freq*x + phase) + offset
    source = ColumnDataSource(data=dict(x=x, y=y))
    plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)
    return plot


# Let's create a simpleapp (SimpleAppWrapper) object by decorating our main
# app function with the simpleapp decorator. It will use the objects
# returned by the function to create the application to be rendered
# through bokeh-server. The decorated function can return 2 types
# of objects:
#
# - dict: in this case it's expected to return keys (as str) that will be
#       used as application widget ids and the related widgets as values.
#       IMPORTANT: In this case the SimpleAppWrapper instance created by
#           the simpleapp decorator needs to decorate a second function
#           that will take care of the app layout creation
#
# - Layout object: in this case the layout and all objects are created
#       in the context of this single decorated function. The function
#       should return a Layout object that arranges all the application
#       widgets and UI as it's children
#
#
# Please note that the simpleapp decorator can be called either without
# arguments (if the application do not integrate interactive widgets)
# or with a set of interactive widgets that can be used to interact and
# be integrated in the application logic. In the following example we
# specify 5 widgets that will be used and integrated in the app.
# It's important to mention that the name of arguments of the decorated
# function need to be equal to the name of the widgets being passed to
# the function otherwise they'll default to None.
# Also note that those widgets do not need to be returned into the wrapped
# function output dictionary in order to be available for the layout
# creation function later.
@simpleapp(title_widget, amplitude_widget, offset_widget, phase_widget, freq_widget)
def sliders(title, amplitude, offset, phase, freq):
    ''' SimpleApp main entry function. This function is to be wrapped by the
    simpleapp decorator holds the creation of all widgets or the application.
    '''
    # NOTE: The simpleapp creation function can create as many widgets and
    #       plots it needs and doesn't necessarily need to create the widgets
    #       outside to pass them to the creation function.
    return {'plot': create_plot(title, amplitude, offset, phase, freq)}

# as we have created the SimpleAppWrapper and just provided the dict
# containing the app widgets we now need to register the app layout
# creation function by decorating it with the `simpleappwrapped`.layout
# decorator.
# The decorated function should return a Layout object that will rule
# the application UI
@sliders.layout
def app_layout(app):
    inputs = AppVBoxForm(app=app,
        children=['title', 'offset', 'amplitude', 'phase', 'freq']
    )
    layout = AppHBox(app=app, children=[inputs, 'plot'])
    return layout

# it's also possible to register callback function to be called when
# some widget are updated by decorating the callback function with
# the  `simpleappwrapped`.update decorator by calling it with a list
# of strings with the names of the widgets that should trigger the
# callback. It's important to mention that the name of
# arguments of the decorated function need to be equal to the name
# of the widgets being passed to the function otherwise they'll
# default to None.
@sliders.update(['title', 'amplitude', 'offset', 'phase', 'freq'])
def updated_inputs(title, amplitude, offset, phase, freq, app):
    return sliders(title, amplitude, offset, phase, freq)

# finally simpleapp need to register the url where to serve the app
# this can be done by calling the `simpleappwrapped`.route method
sliders.route("/bokeh/simplesliders/")
