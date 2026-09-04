#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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

# Standard library imports
import re
from typing import TYPE_CHECKING, Sequence

# Bokeh imports
from ..model import Model, collect_models
from ..themes import ThemeLike

if TYPE_CHECKING:
    from ..document import Document

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'contains_tex_string',
    'FromCurdoc',
    'is_tex_string',
    'submodel_has_python_callbacks',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class FromCurdoc:
    ''' This class merely provides a non-None default value for ``theme``
    arguments, since ``None`` itself is a meaningful value for users to pass.

    '''
    pass

type ThemeSource = ThemeLike | type[FromCurdoc]


def submodel_has_python_callbacks(models: Sequence[Model | Document]) -> bool:
    ''' Traverses submodels to check for Python (event) callbacks

    '''
    has_python_callback = False
    for model in collect_models(models):
        if len(model._callbacks) > 0 or len(model._event_callbacks) > 0:
            has_python_callback = True
            break

    return has_python_callback

def is_tex_string(text: str) -> bool:
    ''' Whether a string begins and ends with MathJax default delimiters

    Args:
        text (str): String to check

    Returns:
        bool: True if string begins and ends with delimiters, False if not
    '''
    dollars = r"^\$\$.*?\$\$$"
    braces  = r"^\\\[.*?\\\]$"
    parens  = r"^\\\(.*?\\\)$"

    pat = re.compile(f"{dollars}|{braces}|{parens}", flags=re.S)
    return pat.match(text) is not None

def contains_tex_string(text: str) -> bool:
    ''' Whether a string contains any pair of MathJax default delimiters
    Args:
        text (str): String to check
    Returns:
        bool: True if string contains delimiters, False if not
    '''
    # these are non-greedy
    dollars = r"\$\$.*?\$\$"
    braces  = r"\\\[.*?\\\]"
    parens  = r"\\\(.*?\\\)"

    pat = re.compile(f"{dollars}|{braces}|{parens}", flags=re.S)
    return pat.search(text) is not None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
