#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Bokeh Application Handler to execute on_session_destroyed callbacks defined
on the Document.

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
from typing import TYPE_CHECKING

# Bokeh imports
from .lifecycle import LifecycleHandler

if TYPE_CHECKING:
    from ..application import SessionContext

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DocumentLifecycleHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class DocumentLifecycleHandler(LifecycleHandler):
    ''' Calls on_session_destroyed callbacks defined on the Document.
    '''

    def __init__(self) -> None:
        super().__init__()
        self._on_session_destroyed = _on_session_destroyed

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _on_session_destroyed(session_context: SessionContext) -> None:
    '''
    Calls any on_session_destroyed callbacks defined on the Document
    '''
    document = session_context.document
    callbacks = document.session_destroyed_callbacks
    document.session_destroyed_callbacks = set()
    callback = None
    for callback in callbacks:
        try:
            callback(session_context)
        except Exception as e:
            logging.getLogger().warning("DocumentLifeCycleHandler on_session_destroyed "
                                        f"callback {callback} failed with following error: {e}")
    if callbacks:
        # If any session callbacks were defined garbage collect after deleting all references
        if callback is not None:
            del callback
        del callbacks

        import gc
        gc.collect()

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
