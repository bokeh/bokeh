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
from bokeh.util.session_id import (
    check_token_signature,
    generate_jwt_token,
    generate_session_id,
    get_session_id,
)

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
        token = self.get_argument("bokeh-token", default=None)
        session_id = self.get_argument("bokeh-session-id", default=None)
        if token is not None:
            if session_id is not None:
                log.debug("Server received both token and session ID, expected only one")
                raise HTTPError(status_code=403, reason="Both token and session ID were provided")
            session_id = get_session_id(token)
        elif session_id is None:
            if self.application.generate_session_ids:
                session_id = generate_session_id(secret_key=self.application.secret_key,
                                                 signed=self.application.sign_sessions)
            else:
                log.debug("Server configured not to generate session IDs and none was provided")
                raise HTTPError(status_code=403, reason="No bokeh-session-id provided")

        if token is None:
            if self.application.request_headers is None:
                headers = list(self.request.headers)
            else:
                headers = self.application.request_headers
            headers = {k: v for k, v in self.request.headers.items() if k in headers}

            if self.application.request_cookies is None:
                cookies = list(self.request.cookies)
            else:
                cookies = self.application.request_cookies
            cookies = {k: v for k, v in self.request.cookies.items() if k in cookies}
            payload = {'headers': headers, 'cookies': cookies}
            token = generate_jwt_token(session_id,
                                       secret_key=self.application.secret_key,
                                       signed=self.application.sign_sessions,
                                       extra_payload=payload)

        if not check_token_signature(token,
                                     secret_key=self.application.secret_key,
                                     signed=self.application.sign_sessions):
            log.error("Session id had invalid signature: %r", session_id)
            raise HTTPError(status_code=403, reason="Invalid token or session ID")

        session = await self.application_context.create_session_if_needed(session_id, self.request, token)

        return session

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
