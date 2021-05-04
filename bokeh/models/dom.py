#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" An abstraction over the document object model (DOM).

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
from ..core.properties import (
    Bool,
    Dict,
    Either,
    Instance,
    List,
    NonNullable,
    Nullable,
    String,
)
from ..model import Model, Qualified
from .css import Styles
from .layouts import LayoutDOM
from .renderers import RendererGroup

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Text",
    "Span",
    "Div",
    "Table",
    "TableRow",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class DOMNode(Model, Qualified):
    """ Base class for DOM nodes. """

class Text(DOMNode):
    """ DOM text node. """
    content = String("")

@abstract
class DOMElement(DOMNode):
    """ Base class for DOM elements. """

    style = Nullable(Either(Instance(Styles), Dict(String, String)))

    children = List(Either(String, Instance(DOMNode), Instance(LayoutDOM)), default=[])

class Span(DOMElement):
    pass

class Div(DOMElement):
    pass

class Table(DOMElement):
    pass

class TableRow(DOMElement):
    pass

def vbox(children: List[DOMNode]) -> Div:
    return Div(style=Styles(display="flex", flex_direction="column"), children=children)

def hbox(children: List[DOMNode]) -> Div:
    return Div(style=Styles(display="flex", flex_direction="row"), children=children)

@abstract
class Action(Model, Qualified):
    pass

class Template(DOMElement):
    actions = List(Instance(Action))

class ToggleGroup(Action):
    groups = List(Instance(RendererGroup))

@abstract
class Placeholder(DOMNode):
    pass

class Index(Placeholder):
    pass

class ValueRef(Placeholder):
    field = NonNullable(String)

class ColorRef(ValueRef):
    hex = Bool(default=True)
    swatch = Bool(default=True)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
