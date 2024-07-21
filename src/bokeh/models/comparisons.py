#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Represent comparisons to be computed on the client (browser) side by
BokehJS. These comparisons may be useful for specifying how DataTable columns
are sorted.

'''

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
    Dict,
    String,
)
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Comparison',
    'CustomJSCompare',
    'NanCompare',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Comparison(Model):
    ''' Base class for ``Comparison`` models that represent a comparison
    to be carried out on the client-side.

    The JavaScript implementation should implement the following method:

    .. code-block:: typescript

        compute(x: unknown, y: unknown): -1 | 0 | 1 {
            //  compare and return -1, 0, or 1
        }

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


class CustomJSCompare(Comparison):
    ''' A client-side comparison performed by evaluating a user-supplied
    JavaScript function. This comparison can be useful for DataTable columns.

    .. warning::
        The explicit purpose of this Bokeh Model is to embed *raw JavaScript
        code* for a browser to execute. If any part of the code is derived
        from untrusted user inputs, then you must take appropriate care to
        sanitize the user input prior to passing to Bokeh.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    args = Dict(String, AnyRef, help="""
    A mapping of names to Python objects. In particular those can be bokeh's models.
    These objects are made available to the callback's code snippet as the values of
    named parameters to the callback. There is no need to manually include the data
    source of the associated glyph renderer, as it is available within the scope of
    the code via `this` keyword (e.g. `this.data` will give access to raw data).
    """)

    code = String(default="", help="""
    A snippet of JavaScript code to execute in the browser. The code is made into
    the body of a generator function and all of the named objects in ``args``
    are available as parameters that the code can use. Must return -1, 0, or 1.
    """)

class NanCompare(Comparison):
    ''' A client-side comparison that can sort NaN values first or last. This
    comparison can be useful for DataTable columns.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    ascending_first = Bool(default=False, help="""
    Whether NaN values should appear first or last in an ascending sort.
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
