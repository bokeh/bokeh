""" Client-side interactivity. """

from __future__ import absolute_import

from warnings import warn
from types import FunctionType

from ..plot_object import PlotObject
from ..properties import Dict, Instance, String


class Callback(PlotObject):
    """ Base class for interactive callback. ``Callback`` is generally
    not useful to instantiate on its own."""


class OpenURL(Callback):
    """ Open a URL in a new tab or window (browser dependent). """

    url = String("http://", help="""
    The URL to direct the web browser to. This can be a template string,
    which will be formatted with data from the data source.
    """)


class CustomJS(Callback):
    """ Execute a JavaScript function. """
    
    def __init__(self, func=None, **kwargs):
        if func is not None:
            if not isinstance(func, FunctionType):
                raise ValueError('CustomJS needs function object, or "args" and "code" properties.')
            from flexx.pyscript import py2js
            # Collect default values
            default_values = func.__defaults__  # Python 2.6+
            default_names = func.__code__.co_varnames[:len(default_values)]
            kwargs['args'] = dict(zip(default_names, default_values))
            # Get JS code, we could rip out the function def, or just
            # call the function. We do the latter.
            kwargs['code'] = py2js(func, 'cb') + 'cb(%s);\n' % ', '.join(default_names)

        Callback.__init__(self, **kwargs)

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


# Deprecated Action
# In the unlikely event, someone has done from bokeh.models import Action,
# this deprecation function handles it gracefully.

def Action(*args, **kwargs):
    warn(
        '`bokeh.models.Action` is now `bokeh.models.Callback`. '
        '`bokeh.models.Action` will be removed in v0.10.',
        FutureWarning, stacklevel=2
    )
    return Callback(*args, **kwargs)
