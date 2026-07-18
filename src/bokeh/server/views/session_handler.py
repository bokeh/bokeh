#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Abstract request handler that handles bokeh-session-id

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportArgumentType=false, reportMissingImports=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING, Any

# External imports
from tornado.httputil import HTTPServerRequest
from tornado.web import HTTPError, authenticated

# Bokeh imports
from ..core import SessionError, create_session
from .auth_request_handler import AuthRequestHandler

if TYPE_CHECKING:
    from ..contexts import ApplicationContext
    from ..session import ServerSession
    from ..tornado import BokehTornado

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'SessionHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class SessionHandler(AuthRequestHandler):
    ''' Implements a custom Tornado handler for document display page

    '''

    application: BokehTornado
    request: HTTPServerRequest

    application_context: ApplicationContext
    bokeh_websocket_path: str

    def __init__(self, tornado_app: BokehTornado, *args: Any, **kw: Any) -> None:
        self.application_context = kw['application_context']
        self.bokeh_websocket_path = kw['bokeh_websocket_path']
        # Note: tornado_app is stored as self.application
        super().__init__(tornado_app, *args, **kw)

    def initialize(self, *args: Any, **kw: Any) -> None:
        pass

    @authenticated # type: ignore[arg-type]
    async def get_session(self) -> ServerSession | None:
        try:
            return await create_session(self.application, self.application_context, self.request)
        except SessionError as error:
            raise HTTPError(status_code=error.status, reason=error.reason)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
