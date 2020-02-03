#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Abstract request handler that handles bokeh-session-id

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from tornado.web import HTTPError, RequestHandler, authenticated

# Bokeh imports
from bokeh.util.session_id import generate_session_id, generate_jwt_token

# Bokeh imports
from .auth_mixin import AuthMixin

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

class SessionHandler(AuthMixin, RequestHandler):
    ''' Implements a custom Tornado handler for document display page

    '''
    def __init__(self, tornado_app, *args, **kw):
        self.application_context = kw['application_context']
        self.bokeh_websocket_path = kw['bokeh_websocket_path']
        # Note: tornado_app is stored as self.application
        super().__init__(tornado_app, *args, **kw)

    def initialize(self, *args, **kw):
        pass

    @authenticated
    async def get_session(self):
        session_id = self.get_argument("bokeh-session-id", default=None)
        # Also allow token (and double sign for now)
        if session_id is None:
            if self.application.generate_session_ids:
                session_id = generate_session_id()
            else:
                log.debug("Server configured not to generate session IDs and none was provided")
                raise HTTPError(status_code=403, reason="No bokeh-session-id provided")
        else:
            log.error("Session ID was requested in HTTP: %r", session_id)
            raise HTTPError(status_code=403, reason="Session ID must be requested using Websocket")

        token = generate_jwt_token(session_id,
                                   secret_key=self.application.secret_key,
                                   signed=self.application.sign_sessions)

        session = await self.application_context.create_session_if_needed(session_id, self.request, token)

        return session

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
