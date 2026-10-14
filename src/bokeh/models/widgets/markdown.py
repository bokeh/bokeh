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

# pyright: reportAbstractUsage=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ...core.property.primitive import Bool
from ...core.property.string import MathString
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

    text = MathString(default="", help="""
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
