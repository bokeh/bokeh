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
    made into the body of a fucntion, and all of of the named objects in
    ``args`` are available as parameters that the code can use. Additionally,
    a ``callback_value`` parameter contains anything that the caller of the
    callback wishes to pass in (e.g., a new slider or widget value).

    .. warning:
        Due to JS context and scoping rules, if the code snippet calls
        external functions that use non-"var" variables with names that
        conflict with names in ``args``, there is the possibility of subtle
        errors.
    """)