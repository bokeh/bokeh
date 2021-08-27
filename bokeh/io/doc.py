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
import weakref
from contextlib import contextmanager
from typing import TYPE_CHECKING, Iterator, List

# Bokeh imports
from .state import curstate

if TYPE_CHECKING:
    from ..document import Document
    from ..document.locking import UnlockedDocumentProxy

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'curdoc',
    'patch_curdoc',
    'set_curdoc',
)

# annotated global must come first in py 3.7
_PATCHED_CURDOCS: List[weakref.ReferenceType[Document|UnlockedDocumentProxy]] = []

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def curdoc() -> Document | UnlockedDocumentProxy:
    ''' Return the document for the current default state.

    Returns:
        Document : the current default document object.

    '''
    if len(_PATCHED_CURDOCS) > 0:
        doc = _PATCHED_CURDOCS[-1]()
        if doc is None:
            raise RuntimeError("Patched curdoc has been previously destroyed")
        return doc
    return curstate().document

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@contextmanager
def patch_curdoc(doc: Document|UnlockedDocumentProxy) -> Iterator[None]:
    ''' Temporarily override the value of ``curdoc()`` and then return it to
    its original state.

    This context manager is useful for controlling the value of ``curdoc()``
    while invoking functions (e.g. callbacks). The cont

    Args:
        doc (Document) : new Document to use for ``curdoc()``

    '''
    global _PATCHED_CURDOCS
    _PATCHED_CURDOCS.append(weakref.ref(doc))
    del doc
    yield
    _PATCHED_CURDOCS.pop()

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

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
