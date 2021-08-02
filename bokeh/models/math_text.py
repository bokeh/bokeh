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
from ..core.properties import NonNullable, String
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
    Render mathematical content using `LaTeX <https://www.latex-project.org/>`_
    notation.

    .. note::
        Bokeh uses `MathJax <https://www.mathjax.org>`_ to render text
        containing mathematical notation.

        MathJax only supports math-mode macros (no text-mode macros). You
        can see more about differences between standard TeX/LaTeX and MathJax
        here: https://docs.mathjax.org/en/latest/input/tex/differences.html
    """

    def __init__(self, text: String, **kwargs) -> None:
        super().__init__(**kwargs)
        self.text = text

    _text = NonNullable(String, help="""
    The text value to render as mathematical notation.
    """)

    @property
    def text(self) -> String:
        return self._text

    @text.setter
    def text(self, value: String) -> None:
        if(value.startswith("$") and value.endswith("$")):
            self._text = value.lstrip("$").rstrip("$")
        else:
            self._text = value


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
