""" Client-side interactivity. """

from __future__ import absolute_import

from ..model import Model
from ..properties import abstract
from ..properties import Dict, Instance, String, Enum
from ..enums import ScriptingLanguage

@abstract
class Callback(Model):
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

    args = Dict(String, Instance(Model), help="""
    A mapping of names to Bokeh plot objects. These objects are made
    available to the callback code snippet as the values of named
    parameters to the callback.
    """)

    code = String(help="""
    A snippet of JavaScript/CoffeeScript code to execute in the browser. The
    code is made into the body of a function, and all of of the named objects in
    ``args`` are available as parameters that the code can use. Additionally,
    a ``cb_obj`` parameter contains the object that triggered the callback
    and an optional ``cb_data`` parameter that contains any tool-specific data
    (i.e. mouse coordinates and hovered glyph indices for the HoverTool).
    """)

    lang = Enum(ScriptingLanguage, default="javascript", help="""
    The implementation scripting language of the snippet. This can be either
    raw JavaScript or CoffeeScript. In CoffeeScript's case, the snippet will
    be compiled at runtime (in a web browser), so you don't need to have
    node.js/io.js, etc. installed.
    """)
