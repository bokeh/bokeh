''' Client-side interactivity.

'''
from __future__ import absolute_import

from types import FunctionType

from ..core.has_props import abstract
from ..core.properties import Dict, Instance, String
from ..model import Model
from ..util.dependencies import import_required
from ..util.compiler import nodejs_compile, CompilationError

@abstract
class Callback(Model):
    ''' Base class for interactive callback.

    '''


class OpenURL(Callback):
    ''' Open a URL in a new tab or window (browser dependent).

    '''

    url = String("http://", help="""
    The URL to direct the web browser to. This can be a template string,
    which will be formatted with data from the data source.
    """)


class CustomJS(Callback):
    ''' Execute a JavaScript function.

    '''

    @classmethod
    def from_py_func(cls, func):
        """ Create a CustomJS instance from a Python function. The
        function is translated to Python using PyScript.
        """
        if not isinstance(func, FunctionType):
            raise ValueError('CustomJS.from_py_func needs function object.')
        pyscript = import_required('flexx.pyscript',
                                   'To use Python functions for CustomJS, you need Flexx ' +
                                   '("conda install -c bokeh flexx" or "pip install flexx")')
        # Collect default values
        default_values = func.__defaults__  # Python 2.6+
        default_names = func.__code__.co_varnames[:len(default_values)]
        args = dict(zip(default_names, default_values))
        args.pop('window', None)  # Clear window, so we use the global window object
        # Get JS code, we could rip out the function def, or just
        # call the function. We do the latter.
        code = pyscript.py2js(func, 'cb') + 'cb(%s);\n' % ', '.join(default_names)
        return cls(code=code, args=args)

    @classmethod
    def from_coffeescript(cls, code, args={}):
        ''' Create a ``CustomJS`` instance from CoffeeScript code.

        '''
        compiled = nodejs_compile(code, lang="coffeescript", file="???")
        if "error" in compiled:
            raise CompilationError(compiled.error)
        else:
            return cls(code=compiled.code, args=args)

    args = Dict(String, Instance(Model), help="""
    A mapping of names to Bokeh plot objects. These objects are made
    available to the callback code snippet as the values of named
    parameters to the callback.
    """)

    code = String(default="", help="""
    A snippet of JavaScript code to execute in the browser. The
    code is made into the body of a function, and all of of the named objects in
    ``args`` are available as parameters that the code can use. Additionally,
    a ``cb_obj`` parameter contains the object that triggered the callback
    and an optional ``cb_data`` parameter that contains any tool-specific data
    (i.e. mouse coordinates and hovered glyph indices for the HoverTool).

    .. note:: Use ``CustomJS.from_coffeescript()`` for CoffeeScript source code.

    """)
