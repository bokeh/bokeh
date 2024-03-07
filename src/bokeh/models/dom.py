#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

# Standard library imports
from typing import Any

# Bokeh imports
from ..core.has_props import HasProps, abstract
from ..core.properties import (
    Bool,
    Dict,
    Either,
    Instance,
    List,
    Required,
    String,
)
from ..core.property.bases import Init
from ..core.property.singletons import Intrinsic
from ..core.validation import error
from ..core.validation.errors import NOT_A_PROPERTY_OF
from ..model import Model, Qualified
from .css import Styles
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

    style = Either(Instance(Styles), Dict(String, String), default={})

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

    groups = List(Instance(".models.renderers.RendererGroup"))

@abstract
class Placeholder(DOMNode):

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

class ValueOf(Placeholder):
    """ A placeholder for the value of a model's property. """

    def __init__(self, obj: Init[HasProps] = Intrinsic, attr: Init[str] = Intrinsic, **kwargs) -> None:
        super().__init__(obj=obj, attr=attr, **kwargs)

    obj: HasProps = Required(Instance(HasProps), help="""
    The object whose property will be observed.
    """)

    attr: str = Required(String, help="""
    The name of the property whose value will be observed.
    """)

    @error(NOT_A_PROPERTY_OF)
    def _check_if_an_attribute_is_a_property_of_a_model(self):
        if self.obj.lookup(self.attr, raises=False):
            return None
        else:
            return f"{self.attr} is not a property of {self.obj}"

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

class HTML(DOMNode):
    """ A parsed HTML fragment with optional references to DOM nodes and UI elements. """

    def __init__(self, *html: str | DOMNode | UIElement, **kwargs: Any) -> None:
        if html and "html" in kwargs:
            raise TypeError("'html' argument specified multiple times")

        processed_html: Init[str | list[str | DOMNode | UIElement]]
        if not html:
            processed_html = kwargs.pop("html", Intrinsic)
        else:
            processed_html = list(html)

        super().__init__(html=processed_html, **kwargs)

    html = Required(Either(String, List(Either(String, Instance(DOMNode), Instance(UIElement)))), help="""
    Either a parsed HTML string with optional references to Bokeh objects using
    ``<ref id="..."></ref>`` syntax. Or a list of parsed HTML interleaved with
    Bokeh's objects. Any DOM node or UI element (even a plot) can be referenced
    here.
    """)

    refs = List(Either(String, Instance(DOMNode), Instance(UIElement)), default=[], help="""
    A collection of objects referenced by ``<ref id="..."></ref>`` from `the `html`` property.
    Objects already included by instance in ``html`` don't have to be repeated here.
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
