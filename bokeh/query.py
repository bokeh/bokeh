''' The query module provides functions for searching Bokeh object
graphs for objects that match specified criteria.

Queries are specified as selectors similar to MongoDB style query
selectors.

Examples::

    # find all objects with type "grid"
    find(p, {'type': 'grid'})

    # find all objects with type "grid" or "axis"
    find(p, {OR: [
        {'type': 'grid'}, {'type': 'axis'}
    ]})

    # same query, using IN operator
    find(p, {'type': {IN: ['grid', 'axis']})

    # find all plot objects on the 'left' layout of the Plot
    list(find(p, {'layout': 'left'}, {'plot': p}))

    # find all subplots in column 0
    find(p, {type: 'plot', 'column: 0}, {'gridplot': p})

    # find all subplots the last row
    find(p, {type: 'plot', 'row': -1}, {'gridplot': p})

'''

from __future__ import absolute_import

from six import string_types

class OR(object): pass

class IN(object): pass
class GT(object): pass
class LT(object): pass
class EQ(object): pass
class GEQ(object): pass
class LEQ(object): pass
class NEQ(object): pass


def match(obj, selector, context={}):
    ''' Test whether a particular object matches a given
    selector.

    Args:
        obj (PlotObject) : object to Test
        selector (JSON-like) : query selector
            See module docs for details

    Returns:
        bool : True if the object matches, False otherwise

    There are two selector keyss that are handled specially. The first
    is 'type', which will do an isinstance check::

        >>> from bokeh.plotting import line
        >>> from bokeh.models import Axis
        >>> p = line([1,2,3], [4,5,6])
        >>> len(list(p.select({'type': Axis})))
        2

    There is also a a 'tags' attribute that `PlotObject` objects have,
    that is a list of user-supplied values. The 'tags' selector key can
    be used to query against this list of tags. An object matches if
    any of the tags in the selector match any of the tags on the
    object::

        >>> from bokeh.plotting import line
        >>> from bokeh.models import Axis
        >>> p = line([1,2,3], [4,5,6])
        >>> p.tags = ["my plot", 10]
        >>> len(list(p.select({'tags': "my plot"})))
        1
        >>> len(list(p.select({'tags': ["my plot", 10]})))
        1

    '''
    for key, val in selector.items():

        # test attributes
        if isinstance(key, string_types):

            # special case 'type'
            if key == "type":
                # type supports IN, check for that first
                if isinstance(val, dict) and list(val.keys()) == [IN]:
                    if not any(isinstance(obj, x) for x in val[IN]): return False
                # otherwise just check the type of the object against val
                elif not isinstance(obj, val): return False

            # special case 'tag'
            elif key == 'tags':
                if isinstance(val, string_types):
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
                    except:
                        return False

                elif isinstance(val, dict):
                    if not match(attr, val): return False

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


def find(objs, selector, context={}):
    ''' Query an object and all of its contained references
    and yield objects that match the given selector.

    Args:
        obj (PlotObject) : object to query
        selector (JSON-like) : query selector
            See module docs for details

    Yields:
        PlotObject : objects that match the query

    Examples:

    '''
    return (obj for obj in objs if match(obj, selector, context))


def _or(obj, selectors):
    return any(match(obj, selector) for selector in selectors)


_operators = {
   IN:  lambda x, y: x in y,
   GT:  lambda x, y: x > y,
   LT:  lambda x, y: x < y,
   EQ:  lambda x, y: x == y,
   GEQ: lambda x, y: x >= y,
   LEQ: lambda x, y: x <= y,
   NEQ: lambda x, y: x != y,
}
