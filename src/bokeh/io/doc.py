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
import weakref
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Generator, cast

# Bokeh imports
from ..document import Document, DocumentLike

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'curdoc',
    'patch_curdoc',
    'set_curdoc',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def curdoc() -> Document:
    ''' Return the current default document.

    Returns:
        Document : the current default document object.

    .. note::
        Inside a callback decorated with
        :func:`~bokeh.document.without_document_lock`, this function returns
        a restricted proxy that permits only safe next-tick callbacks.

    '''
    patched_curdocs = _PATCHED_CURDOCS.get()
    if len(patched_curdocs) > 0:
        doc = patched_curdocs[-1]()
        if doc is None:
            raise RuntimeError("Patched curdoc has been previously destroyed")
        return cast(Document, doc) # UnlockedDocumentProxy enforces callback safety at runtime
    return _DEFAULT_DOCUMENT

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@contextmanager
def patch_curdoc(doc: DocumentLike) -> Generator[None]:
    ''' Temporarily override the value of ``curdoc()`` and then return it to
    its original state.

    This context manager is useful for controlling the value of ``curdoc()``
    while invoking functions (e.g. callbacks). The cont

    Args:
        doc (Document) : new Document to use for ``curdoc()``

    '''
    token = _PATCHED_CURDOCS.set((*_PATCHED_CURDOCS.get(), weakref.ref(doc)))
    del doc
    try:
        yield
    finally:
        _PATCHED_CURDOCS.reset(token)

def set_curdoc(doc: Document) -> None:
    ''' Configure the current document (returned by curdoc()).

    Args:
        doc (Document) : new Document to use for curdoc()

    Returns:
        None

    .. warning::
        Calling this function will replace any existing document.

    '''
    global _DEFAULT_DOCUMENT
    _DEFAULT_DOCUMENT = doc

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_PATCHED_CURDOCS: ContextVar[tuple[weakref.ReferenceType[DocumentLike], ...]] = \
    ContextVar("_PATCHED_CURDOCS", default=())

_DEFAULT_DOCUMENT = Document()

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
