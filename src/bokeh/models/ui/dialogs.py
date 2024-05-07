#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various kinds of dialogs. """

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
from ...core.enums import Movable, Resizable
from ...core.properties import (
    Bool,
    Either,
    Enum,
    Instance,
    Nullable,
    Required,
    String,
)
from ..dom import DOMNode
from ..nodes import Node
from .ui_element import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Dialog",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Dialog(UIElement):
    """ A floating, movable and resizable container for UI elements.

    .. note::
        This model and all its properties is experimental and may change at any point.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    title = Nullable(Either(String, Instance(DOMNode), Instance(UIElement)), help="""
    The title of the dialog.

    This can be either a plain text string, a DOM node, a UI element or a layout.
    """)

    content = Required(Either(String, Instance(DOMNode), Instance(UIElement)), help="""
    The contents of this dialog.

    This can be either a plain text string, a DOM node, a UI element or a layout.
    """)

    pinnable = Bool(default=True, help="""
    Determines whether to allow to pin the dialog.

    A pinned dialog always stays on top of other dialogs. Pinning one dialog
    unpins any other dialogs.
    """)

    collapsible = Bool(default=True, help="""
    Determines whether to allow to collapse the dialog.

    A collapsed dialog only shows its title, while its content is hidden from
    the view. This allows keep a dialog open while having a better accesses
    to UIs below it.

    .. note::
        A dialog can be collapsed by scrolling on its title.
    """)

    minimizable = Bool(default=True, help="""
    Determines whether to allow to minimize the dialog.

    Minimizing a dialog means collapsing it and moving it to a designated
    "minimization" area in the bottom left corner of the viewport.
    """)

    maximizable = Bool(default=True, help="""
    Determines whether to allow to maximize the dialog.

    A maximized dialog covers the entire viewport area. Multiple dialogs
    can be maximized at the same time, but only one will be at the top
    of the viewport.
    """)

    closable = Bool(default=True, help="""
    Determines whether to allow to close the dialog.

    Property ``close_action`` determines what happens when a dialog is
    closed. Note that even if dialog can't be closed through the UI,
    it can be closed programmatically.
    """)

    close_action = Enum("hide", "destroy", default="destroy", help="""
    Determines the action when closing a dialog.

    Options are:

    * ``"hide"`` - Removes the dialog from the DOM, but keeps its
        view "alive", so that it can be opened another time.
    * ``"destroy"`` - Destroys the associated view and the state
        it stores. A dialog needs to be rebuilt with a fresh state
        before it can be opened again.
    """)

    resizable = Enum(Resizable, default="all", help="""
    Determines whether or in which directions a dialog can be resized.
    """)

    movable = Enum(Movable, default="both", help="""
    Determines whether or in which directions a dialog can be moved.
    """)

    symmetric = Bool(default=False, help="""
    Determines if resizing one edge or corner affects the opposite one.
    """)

    top_limit = Nullable(Instance(Node), default=None, help="""
    Optional top movement or resize limit.

    Together with ``bottom_limit``, ``left_limit`` and ``right_limit`` it
    forms a bounding box for movement and resizing of this dialog.
    """)

    bottom_limit = Nullable(Instance(Node), default=None, help="""
    Optional bottom movement or resize limit.

    Together with ``top_limit``, ``left_limit`` and ``right_limit`` it
    forms a bounding box for movement and resizing of this dialog.
    """)

    left_limit = Nullable(Instance(Node), default=None, help="""
    Optional left movement or resize limit.

    Together with ``top_limit``, ``bottom_limit`` and ``right_limit`` it
    forms a bounding box for movement and resizing of this dialog.
    """)

    right_limit = Nullable(Instance(Node), default=None, help="""
    Optional right movement or resize limit.

    Together with ``top_limit``, ``bottom_limit`` and ``left_limit`` it
    forms a bounding box for movement and resizing of this dialog.
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
