#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Callable, List, Optional

# Bokeh imports
from ..util.session_id import generate_session_id
from .base import Kind, Resources, Urls
from .bundles import Asset, ScriptRef

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

PathVersioner = Callable[[str], str]

DEFAULT_SERVER_HOST = "localhost"
DEFAULT_SERVER_PORT = 5006
DEFAULT_SERVER_HTTP_URL = "http://%s:%d/" % (DEFAULT_SERVER_HOST, DEFAULT_SERVER_PORT)

__all__ = ()

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

class ServerResources(Resources):
    mode = "server"

    _default_root_url = DEFAULT_SERVER_HTTP_URL

    def __init__(self, *, root_url: Optional[str] = None, path_versioner: Optional[PathVersioner] = None) -> None:

        """
        root_url (str, optional) : URL and port of Bokeh Server to load resources from
        """
        if root_url and not root_url.endswith("/"):
            root_url = root_url + "/"
        self._root_url = root_url
        self.path_versioner = path_versioner

    def _resolve(self, kind: Kind) -> List[Asset]:
        server = self._server_urls()
        urls = list(server["urls"](self.components(kind), kind))
        return [ ScriptRef(url) for url in urls ]

    @property
    def root_url(self) -> str:
        if self._root_url is not None:
            return self._root_url
        else:
            return self._default_root_url

    def _server_urls(self) -> Urls:
        _minified = ".min" if self.dev or self.minified else ""
        _legacy = "legacy/" if self.legacy else ""

        def mk_url(comp: str, kind: Kind) -> str:
            path = f"{kind}/{_legacy}{comp}{_minified}.{kind}"
            if self.path_versioner is not None:
                path = self.path_versioner(path)
            return f"{self.root_url}static/{path}"

        return {
            "urls": lambda components, kind: [ mk_url(component, kind) for component in components ],
            "messages": [],
        }

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

class _SessionCoordinates(object):
    """ Internal class used to parse kwargs for server URL, app_path, and session_id."""

    _url: str
    _session_id: Optional[str]

    def __init__(self, *, url: str = DEFAULT_SERVER_HTTP_URL, session_id: Optional[str] = None):
        if self._url == "default":
            self._url = DEFAULT_SERVER_HTTP_URL

        if self._url.startswith("ws"):
            raise ValueError("url should be the http or https URL for the server, not the websocket URL")

        self._url = self._url.rstrip("/")

        # we lazy-generate the session_id so we can generate it server-side when appropriate
        self._session_id = session_id

    @property
    def url(self) -> str:
        return self._url

    @property
    def session_id(self) -> str:
        """ Session ID derived from the kwargs provided."""
        if self._session_id is None:
            self._session_id = generate_session_id()
        return self._session_id

    @property
    def session_id_allowing_none(self) -> Optional[str]:
        """ Session ID provided in kwargs, keeping it None if it hasn't been generated yet.

        The purpose of this is to preserve ``None`` as long as possible... in some cases
        we may never generate the session ID because we generate it on the server.
        """
        return self._session_id

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------
