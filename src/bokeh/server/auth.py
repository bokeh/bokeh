#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Framework-neutral authentication policy for Bokeh server frontends. '''

from __future__ import annotations

import inspect
from collections.abc import Awaitable, Callable
from importlib import import_module
from typing import Any

from ..util.asyncio import _run_in_executor
from .request import ServerRequest

__all__ = (
    'AuthPolicy',
    'load_auth_policy',
)

type Authenticator = Callable[[ServerRequest], Any | None | Awaitable[Any | None]]
type LoginURL = str | Callable[[ServerRequest], str | None]


class AuthPolicy:
    ''' Authenticate Bokeh requests without depending on a web framework.

    The authenticator receives a framework-neutral
    :class:`~bokeh.server.request.ServerRequest` and returns an authenticated
    user, or ``None`` to reject the request. Both synchronous and asynchronous
    authenticators are supported.

    Args:
        authenticator: Function that authenticates an HTTP or websocket
            request and returns its user.
        login_url: Optional URL, or request-dependent URL function, used to
            redirect unauthenticated HTTP requests. Without one, Bokeh returns
            HTTP 401.
        logout_url: Optional URL exposed as
            ``curdoc().session_context.logout_url``. The host application is
            responsible for implementing the endpoint.

    '''

    def __init__(self, authenticator: Authenticator, *, login_url: LoginURL | None = None,
            logout_url: str | None = None) -> None:
        self._authenticator = authenticator
        self._login_url = login_url
        self._logout_url = logout_url

    async def authenticate(self, request: ServerRequest) -> Any | None:
        ''' Return the authenticated user for a request, or ``None``. '''
        user = await _run_in_executor(self._authenticator, request)
        if inspect.isawaitable(user):
            user = await user
        return user

    def get_login_url(self, request: ServerRequest) -> str | None:
        ''' Return the login URL for an unauthenticated HTTP request. '''
        if callable(self._login_url):
            return self._login_url(request)
        return self._login_url

    async def get_login_url_async(self, request: ServerRequest) -> str | None:
        ''' Return a request-specific login URL without blocking the event loop. '''
        if callable(self._login_url):
            return await _run_in_executor(self._login_url, request)
        return self._login_url

    @property
    def logout_url(self) -> str | None:
        ''' The logout URL exposed to authenticated Bokeh sessions. '''
        return self._logout_url


def load_auth_policy(spec: str) -> AuthPolicy:
    """Load an AuthPolicy instance from ``module:attribute``.

    The module must be importable on Python's module search path. Import or
    validation failures abort startup; authentication is never silently disabled.
    """
    module, separator, attribute = spec.partition(":")
    if not separator or not module or not attribute or ":" in attribute:
        raise ValueError("Authentication policy must have the form module:attribute")
    policy = getattr(import_module(module), attribute)
    if not isinstance(policy, AuthPolicy):
        raise TypeError(f"{spec} must refer to an AuthPolicy instance")
    return policy
