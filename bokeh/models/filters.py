from __future__ import absolute_import

import inspect
from textwrap import dedent
from types import FunctionType

from ..core.properties import Bool, Dict, Either, Instance, Int, Seq, String
from ..model import Model
from ..util.dependencies import import_required
from ..util.compiler import nodejs_compile, CompilationError

class Filter(Model):
    ''' A Filter model represents a filtering operation that returns a row-wise subset of
    data when applied to a ColumnDataSource.
    '''

    filter = Either(Seq(Int), Seq(Bool))

class IndexFilter(Filter):
    ''' An IndexFilter filters data by returning the subset of data at a given set of indices.
    '''

    indices = Seq(Int, default=[])

class BooleanFilter(Filter):
    ''' A BooleanFilter filters data by returning the subset of data corresponding to indices
    where the values of the booleans array is True.
    '''

    booleans = Seq(Bool, default=[])

class GroupFilter(Filter):
    ''' A GroupFilter represents the rows of a ColumnDataSource where the values of the categorical
    column column_name match the group variable.
    '''

    column_name = String()

    group = String()

class CustomJSFilter(Filter):
    ''' Filter data sources with a custom defined JavaScript function.

    '''

    @classmethod
    def from_py_func(cls, func):
        ''' Create a CustomJSFilter instance from a Python function. The
        fucntion is translated to JavaScript using PyScript.

        The ``func`` function namespace will contain the variable ``source``
        at render time. This will be the data source associated with the CDSView
        that this filter is added to.
        '''
        if not isinstance(func, FunctionType):
            raise ValueError('CustomJSFilter.from_py_func only accepts function objects.')

        pyscript = import_required(
            'flexx.pyscript',
            dedent("""\
                To use Python functions for CustomJSFilter, you need Flexx
                '("conda install -c bokeh flexx" or "pip install flexx")""")
            )

        argspec = inspect.getargspec(func)

        default_names = argspec.args
        default_values = argspec.defaults or []

        if len(default_names) - len(default_values) != 0:
            raise ValueError("Function may only contain keyword arguments.")

        # should the following be all of the values need to be Models?
        if default_values and not any([isinstance(value, Model) for value in default_values]):
            raise ValueError("Default value must be a plot object.")

        func_kwargs = dict(zip(default_names, default_values))
        code = pyscript.py2js(func, 'filter') + 'return filter(%s);\n' % ', '.join(default_names)

        return cls(code=code, args=func_kwargs)

    @classmethod
    def from_coffeescript(cls, code, args={}):
        ''' Create a CustomJSFilter instance from CoffeeScript snippets.
        The function bodies are translated to JavaScript functions using node
        and therefore require return statements.

        The ``code`` function namespace will contain the variable ``source``
        at render time. This will be the data source associated with the CDSView
        that this filter is added to.
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
    A snippet of JavaScript code to filter data contained in a columnar data source.
    The code is made into the body of a function, and all of of the named objects in
    ``args`` are available as parameters that the code can use. The variable
    ``source`` will contain the data source that is associated with the CDSView this
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
