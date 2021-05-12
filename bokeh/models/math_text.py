#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Display a mathematics notation from a string value.
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
from ..core.properties import Nullable, String
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'MathText',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class MathText(Model):
    """
    Class for indicating that a string value should be interpreted as
    mathematics notation.

    Note: it uses MathJax as the rendering engine and it implements only
    the math-mode macros of TeX and LaTeX, not the text-mode macros.

    You can see more of the supported input and differences between "real"
    TeX/LaTeX here: https://docs.mathjax.org/en/latest/input/tex/differences.html
    """

    text = Nullable(String, help="""
    The text value to render.
    """)

    def __init__(self, *args, **kwargs):
        super().__init__(**kwargs)
        if len(args) == 1:
            self.text = args[0]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
