#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.has_props import abstract
from ..core.properties import (
    AnyRef,
    Bool,
    Instance,
    Int,
    NonEmpty,
    Nullable,
    Required,
    RestrictedDict,
    Seq,
    String,
)
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "AllIndices",
    "BooleanFilter",
    "CustomJSFilter",
    "DifferenceFilter",
    "Filter",
    "GroupFilter",
    "IndexFilter",
    "IntersectionFilter",
    "InversionFilter",
    "SymmetricDifferenceFilter",
    "UnionFilter",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Filter(Model):
    ''' A Filter model represents a filtering operation that returns a row-wise subset of
    data when applied to a ``ColumnDataSource``.
    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    def __invert__(self) -> Filter:
        return InversionFilter(operand=self)

    def __and__(self, other: Filter) -> Filter:
        return IntersectionFilter(operands=[self, other])

    def __or__(self, other: Filter) -> Filter:
        return UnionFilter(operands=[self, other])

    def __sub__(self, other: Filter) -> Filter:
        return DifferenceFilter(operands=[self, other])

    def __xor__(self, other: Filter) -> Filter:
        return SymmetricDifferenceFilter(operands=[self, other])

class AllIndices(Filter):
    """ Trivial filter that includes all indices in a dataset. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class InversionFilter(Filter):
    """ Inverts indices resulting from another filter. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    operand = Required(Instance(Filter), help="""
    Indices produced by this filter will be inverted.
    """)

class IntersectionFilter(Filter):
    """ Computes intersection of indices resulting from other filters. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    operands = Required(NonEmpty(Seq(Instance(Filter))), help="""
    Indices produced by a collection of these filters will be intersected.
    """)

class UnionFilter(Filter):
    """ Computes union of indices resulting from other filters. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    operands = Required(NonEmpty(Seq(Instance(Filter))), help="""
    Indices produced by a collection of these filters will be unioned.
    """)

class DifferenceFilter(Filter):
    """ Computes union of indices resulting from other filters. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    operands = Required(NonEmpty(Seq(Instance(Filter))), help="""
    Indices produced by a collection of these filters will be subtracted.
    """)

class SymmetricDifferenceFilter(Filter):
    """ Computes symmetric difference of indices resulting from other filters. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    operands = Required(NonEmpty(Seq(Instance(Filter))), help="""
    Indices produced by a collection of these filters will be xored.
    """)

class IndexFilter(Filter):
    ''' An ``IndexFilter`` filters data by returning the subset of data at a given set of indices.
    '''

    indices = Nullable(Seq(Int), help="""
    A list of integer indices representing the subset of data to select.
    """)

    def __init__(self, *args, **kwargs) -> None:
        if len(args) == 1 and "indices" not in kwargs:
            kwargs["indices"] = args[0]

        super().__init__(**kwargs)

class BooleanFilter(Filter):
    ''' A ``BooleanFilter`` filters data by returning the subset of data corresponding to indices
    where the values of the booleans array is True.
    '''

    booleans = Nullable(Seq(Bool), help="""
    A list of booleans indicating which rows of data to select.
    """)

    def __init__(self, *args, **kwargs) -> None:
        if len(args) == 1 and "booleans" not in kwargs:
            kwargs["booleans"] = args[0]

        super().__init__(**kwargs)

class GroupFilter(Filter):
    ''' A ``GroupFilter`` represents the rows of a ``ColumnDataSource`` where the values of the categorical
    column column_name match the group variable.
    '''

    column_name = Required(String, help="""
    The name of the column to perform the group filtering operation on.
    """)

    group = Required(String, help="""
    The value of the column indicating the rows of data to keep.
    """)

    def __init__(self, *args, **kwargs) -> None:
        if len(args) == 2 and "column_name" not in kwargs and "group" not in kwargs:
            kwargs["column_name"] = args[0]
            kwargs["group"] = args[1]

        super().__init__(**kwargs)

class CustomJSFilter(Filter):
    ''' Filter data sources with a custom defined JavaScript function.

    .. warning::
        The explicit purpose of this Bokeh Model is to embed *raw JavaScript
        code* for a browser to execute. If any part of the code is derived
        from untrusted user inputs, then you must take appropriate care to
        sanitize the user input prior to passing to Bokeh.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    args = RestrictedDict(String, AnyRef, disallow=("source",), help="""
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
            for (let i = 0; i <= source.data['some_column'].length; i++) {
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
