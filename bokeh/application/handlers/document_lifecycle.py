#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

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
        super(DocumentLifecycleHandler, self).__init__(*args, **kwargs)
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
