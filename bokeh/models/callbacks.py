#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

''' Client-side interactivity.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from types import FunctionType

# External imports

# Bokeh imports
from ..core.has_props import abstract
from ..core.properties import Dict, String, Bool, AnyRef
from ..model import Model
from ..util.dependencies import import_required
from ..util.compiler import nodejs_compile, CompilationError

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Callback',
    'OpenURL',
    'CustomJS',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Callback(Model):
    ''' Base class for interactive callback.

    '''


class OpenURL(Callback):
    ''' Open a URL in a new or current tab or window.

    '''

    url = String("http://", help="""
    The URL to direct the web browser to. This can be a template string,
    which will be formatted with data from the data source.
    """)
    same_tab = Bool(False, help="""
    Open URL in a new (`False`, default) or current (`True`) tab or window.
    For `same_tab=False`, whether tab or window will be opened is browser
    dependent.
    """)


class CustomJS(Callback):
    ''' Execute a JavaScript function.

    .. warning::
        The explicit purpose of this Bokeh Model is to embed *raw JavaScript
        code* for a browser to execute. If any part of the code is derived
        from untrusted user inputs, then you must take appropriate care to
        sanitize the user input prior to passing to Bokeh.

    '''

    @classmethod
    def from_py_func(cls, func):
        """ Create a ``CustomJS`` instance from a Python function. The
        function is translated to JavaScript using PScript.
        """
        from bokeh.util.deprecation import deprecated
        deprecated("'from_py_func' is deprecated and will be removed in an eventual 2.0 release. "
                   "Use CustomJS directly instead.")

        if not isinstance(func, FunctionType):
            raise ValueError('CustomJS.from_py_func needs function object.')
        pscript = import_required('pscript',
                                  'To use Python functions for CustomJS, you need PScript ' +
                                  '("conda install -c conda-forge pscript" or "pip install pscript")')
        # Collect default values
        default_values = func.__defaults__  # Python 2.6+
        default_names = func.__code__.co_varnames[:len(default_values)]
        args = dict(zip(default_names, default_values))
        args.pop('window', None)  # Clear window, so we use the global window object
        # Get JS code, we could rip out the function def, or just
        # call the function. We do the latter.
        code = pscript.py2js(func, 'cb') + 'cb(%s);\n' % ', '.join(default_names)
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

    args = Dict(String, AnyRef, help="""
    A mapping of names to Python objects. In particular those can be bokeh's models.
    These objects are made available to the callback's code snippet as the values of
    named parameters to the callback.
    """)

    code = String(default="", help="""
    A snippet of JavaScript code to execute in the browser. The
    code is made into the body of a function, and all of of the named objects in
    ``args`` are available as parameters that the code can use. Additionally,
    a ``cb_obj`` parameter contains the object that triggered the callback
    and an optional ``cb_data`` parameter that contains any tool-specific data
    (i.e. mouse coordinates and hovered glyph indices for the ``HoverTool``).

    .. note:: Use ``CustomJS.from_coffeescript()`` for CoffeeScript source code.

    """)

    use_strict = Bool(default=False, help="""
    Enables or disables automatic insertion of ``"use strict";`` into ``code``.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
