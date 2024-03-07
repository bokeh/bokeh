#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING, Any, Callable

# Bokeh imports
from .handler import Handler

if TYPE_CHECKING:
    from tornado.httputil import HTTPServerRequest

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

    _process_request: Callable[[HTTPServerRequest], dict[str, Any]]

    def __init__(self) -> None:
        super().__init__()
        self._process_request = _return_empty

    # Public methods ----------------------------------------------------------

    def process_request(self, request: HTTPServerRequest) -> dict[str, Any]:
        ''' Processes incoming HTTP request returning a dictionary of
        additional data to add to the session_context.

        Args:
            request: HTTP request

        Returns:
            A dictionary of JSON serializable data to be included on
            the session context.
        '''
        return self._process_request(request)

    @property
    def safe_to_fork(self) -> bool:
        return True

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _return_empty(request: HTTPServerRequest) -> dict[str, Any]:
    return {}

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
