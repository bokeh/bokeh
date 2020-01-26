#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.properties import AnyRef, Bool, Dict, Either, Int, Seq, String
from ..model import Model

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

        super().__init__(**kw)

class IndexFilter(Filter):
    ''' An ``IndexFilter`` filters data by returning the subset of data at a given set of indices.
    '''

    indices = Seq(Int, help="""
    A list of integer indices representing the subset of data to select.
    """)

    def __init__(self, *args, **kw):
        if len(args) == 1 and "indices" not in kw:
            kw["indices"] = args[0]

        super().__init__(**kw)

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

        super().__init__(**kw)

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

        super().__init__(**kw)

class CustomJSFilter(Filter):
    ''' Filter data sources with a custom defined JavaScript function.

    .. warning::
        The explicit purpose of this Bokeh Model is to embed *raw JavaScript
        code* for a browser to execute. If any part of the code is derived
        from untrusted user inputs, then you must take appropriate care to
        sanitize the user input prior to passing to Bokeh.

    '''

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

        .. code-block

            code = '''
            const indices = []
            for (var i = 0; i <= source.data['some_column'].length; i++) {
                if (source.data['some_column'][i] == 'some_value') {
                    indices.push(i)
                }
            }
            return indices
            '''

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
