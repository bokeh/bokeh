#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Bokeh Application Handler to look for Bokeh server request callbacks
in a specified Python module.

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
from .handler import Handler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'RequestHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class RequestHandler(Handler):
    ''' Load a script which contains server request handler callbacks.

    '''

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._process_request = _return_empty
        self.safe_to_fork = True

    # Public methods ----------------------------------------------------------

    def process_request(self, request):
        ''' Processes incoming HTTP request returning a dictionary of
        additional data to add to the session_context.

        Args:
            request: HTTP request

        Returns:
            A dictionary of JSON serializable data to be included on
            the session context.
        '''
        return self._process_request(request)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _return_empty(request):
    return {}

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
