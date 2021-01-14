#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from bokeh.util.token import (
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
        if 'Bokeh-Session-Id' in self.request.headers:
            if session_id is not None:
                log.debug("Server received session ID in request argument and header, expected only one")
                raise HTTPError(status_code=403, reason="session ID was provided as an argument and header")
            session_id = self.request.headers.get('Bokeh-Session-Id')

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
            if self.application.include_headers is None:
                excluded_headers = (self.application.exclude_headers or [])
                allowed_headers = [header for header in self.request.headers
                                   if header not in excluded_headers]
            else:
                allowed_headers = self.application.include_headers
            headers = {k: v for k, v in self.request.headers.items()
                       if k in allowed_headers}

            if self.application.include_cookies is None:
                excluded_cookies = (self.application.exclude_cookies or [])
                allowed_cookies = [cookie for cookie in self.request.cookies
                                   if cookie not in excluded_cookies]
            else:
                allowed_cookies = self.application.include_cookies
            cookies = {k: v.value for k, v in self.request.cookies.items()
                       if k in allowed_cookies}

            payload = {'headers': headers, 'cookies': cookies}
            payload.update(self.application_context.application.process_request(self.request))
            token = generate_jwt_token(session_id,
                                       secret_key=self.application.secret_key,
                                       signed=self.application.sign_sessions,
                                       expiration=self.application.session_token_expiration,
                                       extra_payload=payload)

        if not check_token_signature(token,
                                     secret_key=self.application.secret_key,
                                     signed=self.application.sign_sessions):
            log.error("Session id had invalid signature: %r", session_id)
            raise HTTPError(status_code=403, reason="Invalid token or session ID")

        session = await self.application_context.create_session_if_needed(session_id, self.request, token)

        return session

    # NOTE: The methods below exist on both AuthMixin and RequestHandler. This
    # makes it explicit which of the versions is intended to be called.
    get_login_url = AuthMixin.get_login_url
    get_current_user = AuthMixin.get_current_user
    prepare = AuthMixin.prepare

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
