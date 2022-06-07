#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from ..core.has_props import HasProps, abstract
from ..core.properties import (
    Bool,
    Dict,
    Either,
    Instance,
    List,
    NonNullable as Required,
    Nullable,
    String,
)
from ..core.property.bases import Init
from ..core.property.singletons import Intrinsic
from ..model import Model, Qualified
from .css import Styles
from .renderers import RendererGroup
from .ui.ui_element import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Div",
    "HTML",
    "Span",
    "Table",
    "TableRow",
    "Text",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class DOMNode(Model, Qualified):
    """ Base class for DOM nodes. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class Text(DOMNode):
    """ DOM text node. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    content = String("")

@abstract
class DOMElement(DOMNode):
    """ Base class for DOM elements. """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    style = Nullable(Either(Instance(Styles), Dict(String, String)))

    children = List(Either(String, Instance(DOMNode), Instance(UIElement)), default=[])

class Span(DOMElement):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class Div(DOMElement):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class Table(DOMElement):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class TableRow(DOMElement):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

def vbox(children: List[DOMNode]) -> Div:
    return Div(style=Styles(display="flex", flex_direction="column"), children=children)

def hbox(children: List[DOMNode]) -> Div:
    return Div(style=Styles(display="flex", flex_direction="row"), children=children)

@abstract
class Action(Model, Qualified):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class Template(DOMElement):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    actions = List(Instance(Action))

class ToggleGroup(Action):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    groups = List(Instance(RendererGroup))

@abstract
class Placeholder(DOMNode):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class ValueOf(Placeholder):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    obj = Required(Instance(HasProps), help="""
    """)

    attr = Required(String, help="""
    """)

    # TODO: validation

class Index(Placeholder):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class ValueRef(Placeholder):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    field = Required(String)

class ColorRef(ValueRef):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    hex = Bool(default=True)
    swatch = Bool(default=True)

class HTML(Model, Qualified):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, html: Init[str | list[str | DOMNode | UIElement]] = Intrinsic, **kwargs) -> None:
        super().__init__(html=html, **kwargs)

    html = Required(Either(String, List(Either(String, Instance(DOMNode), Instance(UIElement)))), help="""
    Either a parsed HTML string with optional refereces to bokeh objects using
    ``<ref id="..."></ref>`` syntax. Or a list of parsed HTML interleaved with
    bokeh's objects. Any DOM node or UI element (event a plot) can be referenced
    here.
    """)

    refs = List(Either(String, Instance(DOMNode), Instance(UIElement)), default=[], help="""
    A collection of objected refereced by ``<ref id="..."></ref>`` from ``html`` property.
    Object already included by instance in ``html`` don't have to be repreated here.
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
