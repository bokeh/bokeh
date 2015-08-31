""" Client-side interactivity. """

from __future__ import absolute_import, print_function

from ..plot_object import PlotObject
from ..properties import Dict, Instance, String, Function

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

# keep callback code so we can find it after we serialize and deserialize
# a ServerCallback within the same process
_callback_stash = dict()

class ServerCallback(Action):
    """ Python function to be executed on the server. """

    def __init__(self, *args, **kwargs):
        super(ServerCallback, self).__init__(**kwargs)
        self._code = None
        id = self.ref['id']
        if len(args) > 0:
            self._code = args[0]
            if self._code is None:
                del _callback_stash[id]
            else:
                _callback_stash[id] = self._code
        else:
            if id in _callback_stash:
                self._code = _callback_stash[id]
            # else: maybe we should complain?

    def execute_with(self, doc):
        if self._code is None:
            return
        globals = self._code.__globals__
        for k,v in globals.iteritems():
            if k == '__builtins__':
                continue
            id = None
            try:
                id = v.ref['id']
            except:
                # skip things that don't have a .ref['id']
                pass
            if id is not None:
                if id in doc._models:
                    m = doc._models[id]
                    globals[k] = m
                else:
                    globals[k] = None
        self._code()
