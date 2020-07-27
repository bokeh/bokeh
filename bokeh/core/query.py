#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' The query module provides functions for searching collections of Bokeh
models for instances that match specified criteria.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any, Callable, Dict, Iterator, Optional, Type, Union

# Bokeh imports
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'EQ',
    'find',
    'GEQ',
    'GT',
    'IN',
    'LEQ',
    'LT',
    'match',
    'NEQ',
    'OR',
)

ContextType = Optional[Dict[str, Any]]

SelectorType = Dict[Union[str, Type["_Operator"]], Any]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def find(objs: Iterator[Model], selector: SelectorType, context: ContextType = None) -> Iterator[Model]:
    ''' Query a collection of Bokeh models and yield any that match the
    a selector.

    Args:
        obj (Model) : object to test
        selector (JSON-like) : query selector
        context (dict) : kwargs to supply callable query attributes

    Yields:
        Model : objects that match the query

    Queries are specified as selectors similar to MongoDB style query
    selectors, as described for :func:`~bokeh.core.query.match`.

    Examples:

        .. code-block:: python

            # find all objects with type Grid
            find(p.references(), {'type': Grid})

            # find all objects with type Grid or Axis
            find(p.references(), {OR: [
                {'type': Grid}, {'type': Axis}
            ]})

            # same query, using IN operator
            find(p.references(), {'type': {IN: [Grid, Axis]}})

            # find all plot objects on the 'left' layout of the Plot
            # here layout is a method that takes a plot as context
            find(p.references(), {'layout': 'left'}, {'plot': p})

    '''
    return (obj for obj in objs if match(obj, selector, context))

def match(obj: Model, selector: SelectorType, context: ContextType = None) -> bool:
    ''' Test whether a given Bokeh model matches a given selector.

    Args:
        obj (Model) : object to test
        selector (JSON-like) : query selector
        context (dict) : kwargs to supply callable query attributes

    Returns:
        bool : True if the object matches, False otherwise

    In general, the selectors have the form:

    .. code-block:: python

        { attrname : predicate }

    Where a predicate is constructed from the operators ``EQ``, ``GT``, etc.
    and is used to compare against values of model attributes named
    ``attrname``.

    For example:

    .. code-block:: python

        >>> from bokeh.plotting import figure
        >>> p = figure(plot_width=400)

        >>> match(p, {'plot_width': {EQ: 400}})
        True

        >>> match(p, {'plot_width': {GT: 500}})
        False

    There are two selector keys that are handled especially. The first
    is 'type', which will do an isinstance check:

    .. code-block:: python

        >>> from bokeh.plotting import figure
        >>> from bokeh.models import Axis
        >>> p = figure()

        >>> match(p.xaxis[0], {'type': Axis})
        True

        >>> match(p.title, {'type': Axis})
        False

    There is also a ``'tags'`` attribute that ``Model`` objects have, that
    is a list of user-supplied values. The ``'tags'`` selector key can be
    used to query against this list of tags. An object matches if any of the
    tags in the selector match any of the tags on the object:

    .. code-block:: python

        >>> from bokeh.plotting import figure
        >>> p = figure(tags = ["my plot", 10])

        >>> match(p, {'tags': "my plot"})
        True

        >>> match(p, {'tags': ["my plot", 10]})
        True

        >>> match(p, {'tags': ["foo"]})
        False

    '''
    context = context or {}
    for key, val in selector.items():

        # test attributes
        if isinstance(key, str):

            # special case 'type'
            if key == "type":
                # type supports IN, check for that first
                if isinstance(val, dict) and list(val.keys()) == [IN]:
                    if not any(isinstance(obj, x) for x in val[IN]): return False
                # otherwise just check the type of the object against val
                elif not isinstance(obj, val): return False

            # special case 'tag'
            elif key == 'tags':
                if isinstance(val, str):
                    if val not in obj.tags: return False
                else:
                    try:
                        if not set(val) & set(obj.tags): return False
                    except TypeError:
                        if val not in obj.tags: return False

            # if the object doesn't have the attr, it doesn't match
            elif not hasattr(obj, key): return False

            # if the value to check is a dict, recurse
            else:
                attr = getattr(obj, key)
                if callable(attr):
                    try:
                        if not attr(val, **context): return False
                    except Exception:
                        return False

                elif isinstance(val, dict):
                    if not match(attr, val, context): return False

                else:
                    if attr != val: return False

        # test OR conditionals
        elif key is OR:
            if not _or(obj, val): return False

        # test operands
        elif key in _operators:
            if not _operators[key](obj, val): return False

        else:
            raise ValueError("malformed query selector")

    return True

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class _Operator:
    pass

class OR(_Operator):
    ''' Form disjunctions from other query predicates.

    Construct an ``OR`` expression by making a dict with ``OR`` as the key,
    and a list of other query expressions as the value:

    .. code-block:: python

        # matches any Axis subclasses or models with .name == "mycircle"
        { OR: [dict(type=Axis), dict(name="mycircle")] }

    '''
    pass

class IN(_Operator):
    ''' Predicate to test if property values are in some collection.

    Construct and ``IN`` predicate as a dict with ``IN`` as the key,
    and a list of values to check against.

    .. code-block:: python

        # matches any models with .name in ['a', 'mycircle', 'myline']
        dict(name={ IN: ['a', 'mycircle', 'myline'] })

    '''
    pass

class GT(_Operator):
    ''' Predicate to test if property values are greater than some value.

    Construct and ``GT`` predicate as a dict with ``GT`` as the key,
    and a value to compare against.

    .. code-block:: python

        # matches any models with .size > 10
        dict(size={ GT: 10 })

    '''
    pass

class LT(_Operator):
    ''' Predicate to test if property values are less than some value.

    Construct and ``LT`` predicate as a dict with ``LT`` as the key,
    and a value to compare against.

    .. code-block:: python

        # matches any models with .size < 10
        dict(size={ LT: 10 })

    '''
    pass

class EQ(_Operator):
    ''' Predicate to test if property values are equal to some value.

    Construct and ``EQ`` predicate as a dict with ``EQ`` as the key,
    and a value to compare against.

    .. code-block:: python

        # matches any models with .size == 10
        dict(size={ EQ: 10 })

    '''
    pass

class GEQ(_Operator):
    ''' Predicate to test if property values are greater than or equal to
    some value.

    Construct and ``GEQ`` predicate as a dict with ``GEQ`` as the key,
    and a value to compare against.

    .. code-block:: python

        # matches any models with .size >= 10
        dict(size={ GEQ: 10 })

    '''
    pass

class LEQ(_Operator):
    ''' Predicate to test if property values are less than or equal to
    some value.

    Construct and ``LEQ`` predicate as a dict with ``LEQ`` as the key,
    and a value to compare against.

    .. code-block:: python

        # matches any models with .size <= 10
        dict(size={ LEQ: 10 })

    '''
    pass

class NEQ(_Operator):
    ''' Predicate to test if property values are unequal to some value.

    Construct and ``NEQ`` predicate as a dict with ``NEQ`` as the key,
    and a value to compare against.

    .. code-block:: python

        # matches any models with .size != 10
        dict(size={ NEQ: 10 })

    '''
    pass

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

# realizations of the abstract predicate operators
_operators: Dict[Type["_Operator"], Callable[[Any, Any], Any]] = {
   IN:  lambda x, y: x in y,
   GT:  lambda x, y: x > y,
   LT:  lambda x, y: x < y,
   EQ:  lambda x, y: x == y,
   GEQ: lambda x, y: x >= y,
   LEQ: lambda x, y: x <= y,
   NEQ: lambda x, y: x != y,
}

# realization of the OR operator
def _or(obj: Model, selectors: Iterator[SelectorType]) -> bool:
    return any(match(obj, selector) for selector in selectors)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
