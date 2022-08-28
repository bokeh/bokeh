#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""

"""

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
from ..core.properties import Required, String
from ..core.property.bases import Init
from ..core.property.singletons import Intrinsic
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "ByID",
    "ByClass",
    "ByCSS",
    "ByXPath",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Selector(Model):
    """ Represents a CSS selector query. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class ByID(Selector):
    """ Represents an ID selector query. """

    # explicit __init__ to support Init signatures
    def __init__(self, query: Init[str] = Intrinsic, **kwargs) -> None:
        super().__init__(query=query, **kwargs)

    query = Required(String, help="""
    Element ID without ``#`` prefix. Alternatively use ``ByCSS("#id")``.
    """)

class ByClass(Selector):
    """ Represents an ID selector query. """

    # explicit __init__ to support Init signatures
    def __init__(self, query: Init[str] = Intrinsic, **kwargs) -> None:
        super().__init__(query=query, **kwargs)

    query = Required(String, help="""
    CSS class name without ``.`` prefix. Alternatively use ``ByCSS(".class")``.
    """)

class ByCSS(Selector):
    """ Represents a CSS selector query. """

    # explicit __init__ to support Init signatures
    def __init__(self, query: Init[str] = Intrinsic, **kwargs) -> None:
        super().__init__(query=query, **kwargs)

    query = Required(String, help="""
    CSS selector query (see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors).
    """)

class ByXPath(Selector):
    """ Represents an XPath selector query. """

    # explicit __init__ to support Init signatures
    def __init__(self, query: Init[str] = Intrinsic, **kwargs) -> None:
        super().__init__(query=query, **kwargs)

    query = Required(String, help="""
    XPath selector query (see https://developer.mozilla.org/en-US/docs/Web/XPath).
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
