#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
from typing import TYPE_CHECKING, Any, Literal

# Bokeh imports
from ..core.templates import FILE
from ..resources import DEFAULT_SERVER_HTTP_URL
from ..util.strings import format_docstring

if TYPE_CHECKING:
    from jinja2 import Template

    from ..core.types import ID
    from ..model import Model
    from ..resources import Resources
    from ..server.session import ServerSession

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'server_document',
    'server_session',
    'server_html_page_for_session',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def server_document(url: str = "default", relative_urls: bool = False, resources: Literal["default"] | None = "default",
        arguments: dict[str, str] | None = None, headers: dict[str, str] | None = None, with_credentials: bool = False) -> str:
    ''' Return an artifact fragment that embeds content from a Bokeh server.

    Bokeh apps embedded using these methods will NOT set the browser window title.

    Args:
        url (str, optional) :
            A URL to a Bokeh application on a Bokeh server (default: "default")

            If ``"default"`` the default URL ``{DEFAULT_SERVER_HTTP_URL}`` will be used.

        relative_urls (bool, optional) :
            Whether to use relative URLs for resources.

            If ``True`` the links generated for resources such a BokehJS
            JavaScript and CSS will be relative links.

            This should normally be set to ``False``, but must be set to
            ``True`` in situations where only relative URLs will work. E.g.
            when running the Bokeh behind reverse-proxies under certain
            configurations

        resources (str) : A string specifying what resources need to be loaded
            along with the document.

            If ``default`` then the default JS/CSS bokeh files will be loaded.

            If None then none of the resource files will be loaded. This is
            useful if you prefer to serve those resource files via other means
            (e.g. from a caching server). Be careful, however, that the resource
            files you'll load separately are of the same version as that of the
            server's, otherwise the rendering may not work correctly.

       arguments (dict[str, str], optional) :
            A dictionary of key/values to be passed as HTTP request arguments
            to Bokeh application code (default: None)

       headers (dict[str, str], optional) :
            A dictionary of key/values to be passed as HTTP Headers
            to Bokeh application code (default: None)

            Mutually exclusive with ``with_credentials``

       with_credentials (bool, optional):
            Whether cookies should be passed to Bokeh application code (default: False)

            Mutually exclusive with ``headers``

    Returns:
        Artifact declaration HTML that mounts content from a Bokeh Server.

    '''
    if resources not in ("default", None):
        raise ValueError("resources must be 'default' or None")
    from .compiler import embed_server

    artifact = embed_server(
        url,
        arguments=arguments,
        headers=headers,
        with_credentials=with_credentials,
        relative_urls=relative_urls,
    )
    if resources is None:
        policy: Any = "none"
    else:
        from .resources import ResourcePolicy
        policy = ResourcePolicy(mode="server", root_url=f"{artifact.source['url']}/")
    return artifact.fragment(resources=policy).html

def server_session(model: Model | None = None, session_id: ID | None = None, url: str = "default",
        relative_urls: bool = False, resources: Literal["default"] | None = "default", headers: dict[str, str] | None = None,
        with_credentials: bool = False) -> str:
    ''' Return an artifact fragment for a specific existing session on
    a Bokeh server.

    This function is typically only useful for serving from a a specific session
    that was previously created using the ``bokeh.client`` API.

    Bokeh apps embedded using these methods will NOT set the browser window title.

    .. note::
        Typically you will not want to save or reuse the output of this
        function for different or multiple page loads.

    Args:
        model (Model or None, optional) :
            The object to render from the session, or None. (default: None)

            If None, the entire document will be rendered.

        session_id (str) :
            A server session ID

        url (str, optional) :
            A URL to a Bokeh application on a Bokeh server (default: "default")

            If ``"default"`` the default URL ``{DEFAULT_SERVER_HTTP_URL}`` will be used.

        relative_urls (bool, optional) :
            Whether to use relative URLs for resources.

            If ``True`` the links generated for resources such a BokehJS
            JavaScript and CSS will be relative links.

            This should normally be set to ``False``, but must be set to
            ``True`` in situations where only relative URLs will work. E.g.
            when running the Bokeh behind reverse-proxies under certain
            configurations

        resources (str) : A string specifying what resources need to be loaded
            along with the document.

            If ``default`` then the default JS/CSS bokeh files will be loaded.

            If None then none of the resource files will be loaded. This is
            useful if you prefer to serve those resource files via other means
            (e.g. from a caching server). Be careful, however, that the resource
            files you'll load separately are of the same version as that of the
            server's, otherwise the rendering may not work correctly.

       headers (dict[str, str], optional) :
            A dictionary of key/values to be passed as HTTP Headers
            to Bokeh application code (default: None)

            Mutually exclusive with ``with_credentials``

       with_credentials (bool, optional):
            Whether cookies should be passed to Bokeh application code (default: False)

            Mutually exclusive with ``headers``

    Returns:
        Artifact declaration HTML that mounts content from a Bokeh Server.

        .. warning::
            It is typically a bad idea to reuse the same ``session_id`` for
            every page load. This is likely to create scalability and security
            problems, and will cause "shared Google doc" behavior, which is
            probably not desired.

    '''
    if session_id is None:
        raise ValueError("Must supply a session_id")

    if resources not in ("default", None):
        raise ValueError("resources must be 'default' or None")
    from .compiler import embed_server

    selected = None if model is None else {model.name or "root": model}
    artifact = embed_server(
        url,
        session_id=session_id,
        roots=selected,
        headers=headers,
        with_credentials=with_credentials,
        relative_urls=relative_urls,
    )
    if resources is None:
        policy: Any = "none"
    else:
        from .resources import ResourcePolicy
        policy = ResourcePolicy(mode="server", root_url=f"{artifact.source['url']}/")
    return artifact.fragment(resources=policy).html

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def server_html_page_for_session(session: ServerSession, resources: Resources, title: str,
        template: Template = FILE, template_variables: dict[str, Any] | None = None) -> str:
    '''

    Args:
        session (ServerSession) :

        resources (Resources) :

        title (str) :

        template (Template) :

        template_variables (dict) :

    Returns:
        str

    '''
    from .compiler import embed_server

    artifact = embed_server(".", token=session.token)
    return artifact.page(
        resources=resources,
        title=title,
        template=template,
        template_variables=template_variables,
    )

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

server_document.__doc__ = format_docstring(server_document.__doc__, DEFAULT_SERVER_HTTP_URL=DEFAULT_SERVER_HTTP_URL)
server_session.__doc__ = format_docstring(server_session.__doc__, DEFAULT_SERVER_HTTP_URL=DEFAULT_SERVER_HTTP_URL)
