#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a mixin class to add authorization hooks to a request handler.

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
from typing import Any, cast
from urllib.parse import urljoin

# External imports
from tornado.web import RequestHandler

# Bokeh imports
from ...util.asyncio import _run_in_executor

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AuthRequestHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class AuthRequestHandler(RequestHandler):
    ''' This mixin adds the expected Tornado authorization hooks:

    * get_login_url
    * get_current_user
    * prepare

    All of these delegate to the a :class:`~bokeh.serve.auth_provider.AuthProvider`
    configured on the Bokeh tornado application.

    '''

    @property
    def bokeh_app(self) -> Any:
        return cast(Any, self.application)

    def get_login_url(self) -> str:
        ''' Delegates to``get_login_url`` method of the auth provider, or the
        ``login_url`` attribute.

        '''
        auth_provider = self.bokeh_app.auth_provider
        if hasattr(self, "_bokeh_login_url"):
            return self._bokeh_login_url
        if auth_provider.get_login_url is not None:
            return auth_provider.get_login_url(self)
        if auth_provider.login_url is not None:
            # second arg must be lstrip'd to avoid dropping the prefix
            # (urljoin treats a leading-slash second arg as an absolute path and discards the base)
            return urljoin(self.bokeh_app.prefix + "/", auth_provider.login_url.lstrip("/"))
        raise RuntimeError('login_url or get_login_url() must be supplied when authentication hooks are enabled')

    def get_current_user(self) -> Any:
        ''' Delegate to the synchronous ``get_user`` method of the auth
        provider

        '''
        auth_provider = self.bokeh_app.auth_provider
        if auth_provider.get_user is not None:
            return auth_provider.get_user(self)
        return "default_user"

    async def prepare(self) -> None:
        ''' Async counterpart to ``get_current_user``

        '''
        auth_provider = self.bokeh_app.auth_provider
        if auth_provider.get_user_async is not None:
            self.current_user = await auth_provider.get_user_async(self)
        elif auth_provider.get_user is not None and self.request.method != "OPTIONS":
            self.current_user = await _run_in_executor(auth_provider.get_user, self)
        else:
            return

        if (
            not self.current_user
            and self.request.method in ("GET", "HEAD")
            and auth_provider.get_login_url is not None
        ):
            self._bokeh_login_url = await _run_in_executor(auth_provider.get_login_url, self)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
