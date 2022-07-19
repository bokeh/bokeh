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
from ...core.properties import (
    Bool,
    Either,
    Instance,
    List,
    Nullable,
    Required,
    String,
)
from ..dom import DOMNode
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

Button = UIElement # TODO

class Dialog(UIElement):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)


    title = Nullable(Either(String, Instance(DOMNode)), default=None, help="""
    """)

    content = Required(Either(String, Instance(DOMNode), Instance(UIElement)), help="""
    """)

    buttons = List(Instance(Button), default=[], help="""
    """)

    modal = Bool(default=False, help="""
    """)

    closable = Bool(default=True, help="""
    Whether to show close (x) button in the title bar.
    """)

    draggable = Bool(default=True, help="""
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
