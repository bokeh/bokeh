#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from .lifecycle import LifecycleHandler

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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._on_session_destroyed = _on_session_destroyed

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _on_session_destroyed(session_context):
    '''
    Calls any on_session_destroyed callbacks defined on the Document
    '''
    callbacks = session_context._document.session_destroyed_callbacks
    session_context._document.session_destroyed_callbacks = set()
    for callback in callbacks:
        try:
            callback(session_context)
        except Exception as e:
            log.warning('DocumentLifeCycleHandler on_session_destroyed '
                        'callback %s failed with following error: %s'
                        % (callback, e))
    if callbacks:
        # If any session callbacks were defined garbage collect after deleting all references
        del callback
        del callbacks

        import gc
        gc.collect()

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
