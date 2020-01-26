# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
""" The resources module provides the Resources class for easily configuring
how BokehJS code and CSS resources should be located, loaded, and embedded in
Bokeh documents.

Additionally, functions for retrieving `Subresource Integrity`_ hashes for
Bokeh JavaScript files are provided here.

Some pre-configured Resources objects are made available as attributes.

Attributes:
    CDN : load minified BokehJS from CDN
    INLINE : provide minified BokehJS from library static directory

.. _Subresource Integrity: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import json
import re
from os.path import basename, join, relpath
from typing import Callable, Dict, List, Optional, Tuple, cast
from typing_extensions import Literal, TypedDict

# Bokeh imports
from .. import __version__
from .core.templates import CSS_RESOURCES, JS_RESOURCES
from .model import Model
from .settings import settings
from .util.paths import bokehjsdir
from .util.token import generate_session_id

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

DEFAULT_SERVER_HOST = "localhost"
DEFAULT_SERVER_PORT = 5006
DEFAULT_SERVER_HTTP_URL = "http://%s:%d/" % (DEFAULT_SERVER_HOST, DEFAULT_SERVER_PORT)

Mode = Literal["inline", "cdn", "server", "server-dev", "relative", "relative-dev", "absolute", "absolute-dev"]
LogLevel = Literal["trace", "debug", "info", "warn", "error", "fatal"]
PathVersioner = Callable[[str], str]
Kind = Literal["js", "css"]

class Message(TypedDict):
    type: str
    text: str

class Urls(TypedDict):
    urls: Callable[[List[str], Kind], List[str]]
    messages: List[Message]

# __all__ defined at the bottom on the class module

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

class BaseResources(object):
    _default_root_dir = "."
    _default_root_url = DEFAULT_SERVER_HTTP_URL

    _js_components: List[str]
    _css_components: List[str]
    _log_level: Optional[LogLevel]

    messages: List[Message]

    def __init__(
        self,
        mode: Optional[Mode] = None,
        version: Optional[str] = None,
        root_dir: Optional[str] = None,
        minified: Optional[bool] = None,
        legacy: Optional[bool] = None,
        log_level: Optional[LogLevel] = None,
        root_url: Optional[str] = None,
        path_versioner: Optional[PathVersioner] = None,
        components: Optional[List[str]] = None,
        base_dir: Optional[str] = None,
    ) -> None:
        self._components = components

        if hasattr(self, "_js_components"):
            self.js_components = self._js_components
        if hasattr(self, "_css_components"):
            self.css_components = self._css_components

        self.mode = settings.resources(mode)
        del mode
        self.root_dir = settings.rootdir(root_dir)
        del root_dir
        self.version = settings.version(version)
        del version
        self.minified = settings.minified(minified)
        del minified
        self.legacy = settings.legacy(legacy)
        del legacy
        self.log_level = settings.log_level(log_level)
        del log_level
        self.path_versioner = path_versioner
        del path_versioner

        if root_url and not root_url.endswith("/"):
            # root_url should end with a /, adding one
            root_url = root_url + "/"
        self._root_url = root_url
        if self.mode not in [
            "inline",
            "cdn",
            "server",
            "server-dev",
            "relative",
            "relative-dev",
            "absolute",
            "absolute-dev",
        ]:
            raise ValueError(
                "wrong value for 'mode' parameter, expected "
                "'inline', 'cdn', 'server(-dev)', 'relative(-dev)' or 'absolute(-dev)', got %r" % self.mode
            )

        if self.root_dir and not self.mode.startswith("relative"):
            raise ValueError("setting 'root_dir' makes sense only when 'mode' is set to 'relative'")

        if self.version and not self.mode.startswith("cdn"):
            raise ValueError("setting 'version' makes sense only when 'mode' is set to 'cdn'")

        if root_url and not self.mode.startswith("server"):
            raise ValueError("setting 'root_url' makes sense only when 'mode' is set to 'server'")

        self.dev = self.mode.endswith("-dev")
        if self.dev:
            self.mode = self.mode[:-4]

        self.messages = []

        if self.mode == "cdn":
            cdn = self._cdn_urls()
            self.messages.extend(cdn["messages"])
        elif self.mode == "server":
            server = self._server_urls()
            self.messages.extend(server["messages"])

        self.base_dir = base_dir or bokehjsdir(self.dev)

    # Properties --------------------------------------------------------------

    @property
    def log_level(self) -> Optional[LogLevel]:
        return self._log_level

    @log_level.setter
    def log_level(self, level: Optional[LogLevel]) -> None:
        valid_levels = ["trace", "debug", "info", "warn", "error", "fatal"]
        if not (level is None or level in valid_levels):
            raise ValueError("Unknown log level '{}', valid levels are: {}".format(level, str(valid_levels)))
        self._log_level = level

    @property
    def root_url(self) -> str:
        if self._root_url is not None:
            return self._root_url
        else:
            return self._default_root_url

    # Public methods ----------------------------------------------------------

    def components(self, kind: Kind) -> List[str]:
        components = self.js_components if kind == "js" else self.css_components
        if self._components is not None:
            components = [c for c in components if c in self._components]
        return components

    def _file_paths(self, kind: Kind) -> List[str]:
        minified = ".min" if not self.dev and self.minified else ""
        legacy = "legacy" if self.legacy else ""
        files = ["%s%s.%s" % (component, minified, kind) for component in self.components(kind)]
        paths = [join(self.base_dir, kind, legacy, file) for file in files]
        return paths

    def _collect_external_resources(self, resource_attr: str) -> List[str]:
        """ Collect external resources set on resource_attr attribute of all models."""
        external_resources: List[str] = []

        for _, cls in sorted(Model.model_class_reverse_map.items(), key=lambda arg: arg[0]):
            external = getattr(cls, resource_attr, None)

            if isinstance(external, str):
                if external not in external_resources:
                    external_resources.append(external)
            elif isinstance(external, list):
                for e in external:
                    if e not in external_resources:
                        external_resources.append(e)

        return external_resources

    def _cdn_urls(self) -> Urls:
        return _get_cdn_urls(self.version, self.minified, self.legacy)

    def _server_urls(self) -> Urls:
        return _get_server_urls(self.root_url, False if self.dev else self.minified, self.legacy, self.path_versioner)

    def _resolve(self, kind: Kind) -> Tuple[List[str], List[str]]:
        paths = self._file_paths(kind)

        files: List[str] = []
        raw: List[str] = []

        if self.mode == "inline":
            raw = [self._inline(path) for path in paths]
        elif self.mode == "relative":
            root_dir = self.root_dir or self._default_root_dir
            files = [relpath(path, root_dir) for path in paths]
        elif self.mode == "absolute":
            files = list(paths)
        elif self.mode == "cdn":
            cdn = self._cdn_urls()
            files = list(cdn["urls"](self.components(kind), kind))
        elif self.mode == "server":
            server = self._server_urls()
            files = list(server["urls"](self.components(kind), kind))

        return (files, raw)

    @staticmethod
    def _inline(path: str) -> str:
        begin = "/* BEGIN %s */" % basename(path)
        with open(path, "rb") as f:
            middle = f.read().decode("utf-8")
        end = "/* END %s */" % basename(path)
        return "%s\n%s\n%s" % (begin, middle, end)


class Resources(BaseResources):
    """ The Resources class encapsulates information relating to loading or
    embedding Bokeh Javascript and CSS.

    Args:
        mode (str) : how should Bokeh JS and CSS be included in output

            See below for descriptions of available modes

        version (str, optional) : what version of Bokeh JS and CSS to load

            Only valid with the ``'cdn'`` mode

        root_dir (str, optional) : root directory for loading Bokeh JS and CSS assets

            Only valid with ``'relative'`` and ``'relative-dev'`` modes

        minified (bool, optional) : whether JavaScript and CSS should be minified or not (default: True)

        root_url (str, optional) : URL and port of Bokeh Server to load resources from

            Only valid with ``'server'`` and ``'server-dev'`` modes

    The following **mode** values are available for configuring a Resource object:

    * ``'inline'`` configure to provide entire Bokeh JS and CSS inline
    * ``'cdn'`` configure to load Bokeh JS and CSS from ``https://cdn.bokeh.org``
    * ``'server'`` configure to load from a Bokeh Server
    * ``'server-dev'`` same as ``server`` but supports non-minified assets
    * ``'relative'`` configure to load relative to the given directory
    * ``'relative-dev'`` same as ``relative`` but supports non-minified assets
    * ``'absolute'`` configure to load from the installed Bokeh library static directory
    * ``'absolute-dev'`` same as ``absolute`` but supports non-minified assets

    Once configured, a Resource object exposes the following public attributes:

    Attributes:
        js_raw : any raw JS that needs to be placed inside ``<script>`` tags
        css_raw : any raw CSS that needs to be places inside ``<style>`` tags
        js_files : URLs of any JS files that need to be loaded by ``<script>`` tags
        css_files : URLs of any CSS files that need to be loaded by ``<link>`` tags
        messages : any informational messages concerning this configuration

    These attributes are often useful as template parameters when embedding
    Bokeh plots.

    """

    _js_components: List[str] = ["bokeh", "bokeh-widgets", "bokeh-tables", "bokeh-gl"]
    _css_components: List[str] = []

    @property
    def js_files(self) -> List[str]:
        files, _ = self._resolve("js")
        external_resources = self._collect_external_resources("__javascript__")
        return external_resources + files

    @property
    def js_raw(self) -> List[str]:
        _, raw = self._resolve("js")

        if self.log_level is not None:
            raw.append('Bokeh.set_log_level("%s");' % self.log_level)

        if self.dev:
            raw.append("Bokeh.settings.dev = true")

        return raw

    def render_js(self) -> str:
        return cast(str, JS_RESOURCES.render(js_raw=self.js_raw, js_files=self.js_files))

    @property
    def css_files(self) -> List[str]:
        files, _ = self._resolve("css")
        external_resources = self._collect_external_resources("__css__")
        return external_resources + files

    @property
    def css_raw(self) -> List[str]:
        _, raw = self._resolve("css")
        return raw

    @property
    def css_raw_str(self) -> List[str]:
        return [json.dumps(css) for css in self.css_raw]

    def render_css(self) -> str:
        return cast(str, CSS_RESOURCES.render(css_raw=self.css_raw, css_files=self.css_files))

    def render(self) -> str:
        return "%s\n%s" % (self.render_css(), self.render_js())

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

    # Properties --------------------------------------------------------------

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


_DEV_PAT = re.compile(r"^(\d)+\.(\d)+\.(\d)+(dev|rc)")


def _cdn_base_url() -> str:
    return "https://cdn.bokeh.org"


def _get_cdn_urls(version: Optional[str] = None, minified: bool = True, legacy: bool = False) -> Urls:
    if version is None:
        if settings.docs_cdn():
            version = settings.docs_cdn()
        else:
            version = __version__.split("-")[0]

    # check if we want minified js and css
    _minified = ".min" if minified else ""
    _legacy = "legacy/" if legacy else ""

    base_url = _cdn_base_url()
    dev_container = "bokeh/dev"
    rel_container = "bokeh/release"

    # check the 'dev' fingerprint
    container = dev_container if _DEV_PAT.match(version) else rel_container

    if version.endswith(("dev", "rc")):
        log.debug("Getting CDN URL for local dev version will not produce usable URL")

    def mk_url(comp: str, kind: Kind) -> str:
        return f"{base_url}/{container}/{_legacy}{comp}-{version}{_minified}.{kind}"

    result: Urls = {"urls": lambda components, kind: [mk_url(component, kind) for component in components], "messages": []}

    if len(__version__.split("-")) > 1:
        result["messages"].append(
            {
                "type": "warn",
                "text": (
                    "Requesting CDN BokehJS version '%s' from Bokeh development version '%s'. "
                    "This configuration is unsupported and may not work!" % (version, __version__)
                ),
            }
        )

    return result


def _get_server_urls(root_url: str, minified: bool = True, legacy: bool = False, path_versioner: Optional[PathVersioner] = None) -> Urls:
    _minified = ".min" if minified else ""
    _legacy = "legacy/" if legacy else ""

    def mk_url(comp: str, kind: Kind) -> str:
        path = f"{kind}/{_legacy}{comp}{_minified}.{kind}"
        if path_versioner is not None:
            path = path_versioner(path)
        return f"{root_url}static/{path}"

    return {"urls": lambda components, kind: [mk_url(component, kind) for component in components], "messages": []}

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------

CDN = Resources(mode="cdn")

INLINE = Resources(mode="inline")

INLINE_LEGACY = Resources(mode="inline", legacy=True)

__all__ = (
    "CDN",
    "INLINE",
    "INLINE_LEGACY",
    "Resources",
)
