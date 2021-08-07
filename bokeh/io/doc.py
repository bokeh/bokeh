#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from contextlib import contextmanager
from typing import TYPE_CHECKING, List

# Bokeh imports
from .state import curstate

if TYPE_CHECKING:
    from ..document import Document

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'curdoc',
    'patch_curdoc',
    'set_curdoc',
)

# annotated global must come first in py 3.7
_PATCHED_CURDOCS: List[Document] = []

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def curdoc() -> Document:
    ''' Return the document for the current default state.

    Returns:
        Document : the current default document object.

    '''
    if len(_PATCHED_CURDOCS) > 0:
        return _PATCHED_CURDOCS[-1]
    return curstate().document

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def set_curdoc(doc: Document) -> None:
    ''' Configure the current document (returned by curdoc()).

    Args:
        doc (Document) : new Document to use for curdoc()

    Returns:
        None

    .. warning::
        Calling this function will replace any existing document.

    '''
    curstate().document = doc

@contextmanager
def patch_curdoc(doc: Document) -> None:
    '''

    Args:
        doc (Document) : new Document

    '''
    global _PATCHED_CURDOCS
    _PATCHED_CURDOCS.append(doc)
    yield
    _PATCHED_CURDOCS.pop()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
