#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Component for displaying Markdown formatted contents.

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
from ...core.property.primitive import Bool, String
from .widget import Widget

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Markdown",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Markdown(Widget):
    """ A component for displaying Markdown formatted contents.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    text = String(default="", help="""
    The text with Markdown syntax to display.

    See https://www.markdownlang.com/cheatsheet/ for syntax details.
    """)

    disable_math = Bool(False, help="""
    Whether the contents should not be processed as TeX/LaTeX input.
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
