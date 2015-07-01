""" Client-side interactivity. """

from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Dict, Instance, String

class Action(PlotObject):
    """ Base class for interactive actions. """

class OpenURL(Action):
    """ Open a URL in a new tab or window (browser dependent). """

    url = String("http://", help="""
    The URL to direct the web browser to. This can be a template string,
    which will be formatted with data from the data source.
    """)

class Callback(Action):
    """ Execute a JavaScript function. """

    args = Dict(String, Instance(PlotObject), help="""
    A mapping of names to Bokeh plot obejcts. These objects are made
    available to the callback code snippet as the values of named
    parameters to the callback.
    """)

    code = String(help="""
    A snippet of JavaScript code to execute in the browser. The code is
    made into the body of a function, and all of of the named objects in
    ``args`` are available as parameters that the code can use. Additionally,
    a ``cb_obj`` parameter contains the object that triggered the callback
    and an optional ``cb_data`` parameter that contains any tool-specific data
    (i.e. mouse coordinates and hovered glyph indices for the HoverTool).
    """)
