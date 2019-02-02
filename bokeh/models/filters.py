#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

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
import inspect
from textwrap import dedent
from types import FunctionType

# External imports

# Bokeh imports
from ..core.properties import Bool, Dict, Either, Int, Seq, String, AnyRef
from ..model import Model
from ..util.dependencies import import_required
from ..util.compiler import nodejs_compile, CompilationError

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'BooleanFilter',
    'CustomJSFilter',
    'Filter',
    'GroupFilter',
    'IndexFilter',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Filter(Model):
    ''' A Filter model represents a filtering operation that returns a row-wise subset of
    data when applied to a ``ColumnDataSource``.
    '''

    filter = Either(Seq(Int), Seq(Bool), help="""
    A list that can be either integer indices or booleans representing a row-wise subset of data.
    """)

    def __init__(self, *args, **kw):
        if len(args) == 1 and "filter" not in kw:
            kw["filter"] = args[0]

        super(Filter, self).__init__(**kw)

class IndexFilter(Filter):
    ''' An ``IndexFilter`` filters data by returning the subset of data at a given set of indices.
    '''

    indices = Seq(Int, help="""
    A list of integer indices representing the subset of data to select.
    """)

    def __init__(self, *args, **kw):
        if len(args) == 1 and "indices" not in kw:
            kw["indices"] = args[0]

        super(IndexFilter, self).__init__(**kw)

class BooleanFilter(Filter):
    ''' A ``BooleanFilter`` filters data by returning the subset of data corresponding to indices
    where the values of the booleans array is True.
    '''

    booleans = Seq(Bool, help="""
    A list of booleans indicating which rows of data to select.
    """)

    def __init__(self, *args, **kw):
        if len(args) == 1 and "booleans" not in kw:
            kw["booleans"] = args[0]

        super(BooleanFilter, self).__init__(**kw)

class GroupFilter(Filter):
    ''' A ``GroupFilter`` represents the rows of a ``ColumnDataSource`` where the values of the categorical
    column column_name match the group variable.
    '''

    column_name = String(help="""
    The name of the column to perform the group filtering operation on.
    """)

    group = String(help="""
    The value of the column indicating the rows of data to keep.
    """)

    def __init__(self, *args, **kw):
        if len(args) == 2 and "column_name" not in kw and "group" not in kw:
            kw["column_name"] = args[0]
            kw["group"] = args[1]

        super(GroupFilter, self).__init__(**kw)

class CustomJSFilter(Filter):
    ''' Filter data sources with a custom defined JavaScript function.

    .. warning::
        The explicit purpose of this Bokeh Model is to embed *raw JavaScript
        code* for a browser to execute. If any part of the code is derived
        from untrusted user inputs, then you must take appropriate care to
        sanitize the user input prior to passing to Bokeh.

    '''

    @classmethod
    def from_py_func(cls, func):
        ''' Create a ``CustomJSFilter`` instance from a Python function. The
        function is translated to JavaScript using PScript.

        The ``func`` function namespace will contain the variable ``source``
        at render time. This will be the data source associated with the ``CDSView``
        that this filter is added to.
        '''
        from bokeh.util.deprecation import deprecated
        deprecated("'from_py_func' is deprecated and will be removed in an eventual 2.0 release. "
                   "Use CustomJSFilter directly instead.")

        if not isinstance(func, FunctionType):
            raise ValueError('CustomJSFilter.from_py_func only accepts function objects.')

        pscript = import_required(
            'pscript',
            dedent("""\
                To use Python functions for CustomJSFilter, you need PScript
                '("conda install -c conda-forge pscript" or "pip install pscript")""")
            )

        argspec = inspect.getargspec(func)

        default_names = argspec.args
        default_values = argspec.defaults or []

        if len(default_names) - len(default_values) != 0:
            raise ValueError("Function may only contain keyword arguments.")

        # should the following be all of the values need to be Models?
        if default_values and not any(isinstance(value, Model) for value in default_values):
            raise ValueError("Default value must be a plot object.")

        func_kwargs = dict(zip(default_names, default_values))
        code = pscript.py2js(func, 'filter') + 'return filter(%s);\n' % ', '.join(default_names)

        return cls(code=code, args=func_kwargs)

    @classmethod
    def from_coffeescript(cls, code, args={}):
        ''' Create a ``CustomJSFilter`` instance from CoffeeScript snippets.
        The function bodies are translated to JavaScript functions using node
        and therefore require return statements.

        The ``code`` function namespace will contain the variable ``source``
        at render time. This will be the data source associated with the
        ``CDSView`` that this filter is added to.
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
    A snippet of JavaScript code to filter data contained in a columnar data source.
    The code is made into the body of a function, and all of of the named objects in
    ``args`` are available as parameters that the code can use. The variable
    ``source`` will contain the data source that is associated with the ``CDSView`` this
    filter is added to.

    The code should either return the indices of the subset or an array of booleans
    to use to subset data source rows.

    Example:

        .. code-block:: javascript

            code = '''
            var indices = [];
            for (var i = 0; i <= source.data['some_column'].length; i++){
                if (source.data['some_column'][i] == 'some_value') {
                    indices.push(i)
                }
            }
            return indices;
            '''

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
