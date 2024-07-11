# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import json
import os
import re
from os.path import relpath
from pathlib import Path
from typing import (
    Callable,
    ClassVar,
    Literal,
    Protocol,
    TypeAlias,
    TypedDict,
    cast,
    get_args,
)

# Bokeh imports
from . import __version__
from .core.templates import CSS_RESOURCES, JS_RESOURCES
from .core.types import ID, PathLike
from .model import Model
from .settings import LogLevel, settings
from .util.dataclasses import dataclass, field
from .util.paths import ROOT_DIR
from .util.token import generate_session_id
from .util.version import is_full_release

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

DEFAULT_SERVER_HOST = settings.default_server_host()
DEFAULT_SERVER_PORT = settings.default_server_port()

def server_url(host: str | None = None, port: int | None = None, ssl: bool = False) -> str:
    protocol = "https" if ssl else "http"
    return f"{protocol}://{host or DEFAULT_SERVER_HOST}:{port or DEFAULT_SERVER_PORT}/"

DEFAULT_SERVER_HTTP_URL = server_url()

BaseMode: TypeAlias = Literal["inline", "cdn", "server", "relative", "absolute"]
DevMode: TypeAlias = Literal["server-dev", "relative-dev", "absolute-dev"]

ResourcesMode: TypeAlias = BaseMode | DevMode

Component = Literal["bokeh", "bokeh-gl", "bokeh-widgets", "bokeh-tables", "bokeh-mathjax", "bokeh-api"]

class ComponentDefs(TypedDict):
    js: list[Component]
    css: list[Component]

# __all__ defined at the bottom on the class module

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

Hashes: TypeAlias = dict[str, str]

_ALL_SRI_HASHES: dict[str, Hashes] = {}

def get_all_sri_versions() -> tuple[str, ...]:
    """ Report all versions that have SRI hashes.

    Returns:
        tuple

    """
    files = (ROOT_DIR / "_sri").glob("*.json")
    return set(file.stem for file in files)


def get_sri_hashes_for_version(version: str) -> Hashes:
    """ Report SRI script hashes for a specific version of BokehJS.

    Bokeh provides `Subresource Integrity`_ hashes for all JavaScript files that
    are published to CDN for full releases. This function returns a dictionary
    that maps JavaScript filenames to their hashes, for a single version of
    Bokeh.

    Args:
        version (str) :
            The Bokeh version to return SRI hashes for. Hashes are only provided
            for full releases, e.g "1.4.0", and not for "dev" builds or release
            candidates.

    Returns:
        dict

    Raises:
        ValueError: if the specified version does not exist

    Example:

        The returned dict for a single version will map filenames for that
        version to their SRI hashes:

        .. code-block:: python

            {
                'bokeh-1.4.0.js': 'vn/jmieHiN+ST+GOXzRU9AFfxsBp8gaJ/wvrzTQGpIKMsdIcyn6U1TYtvzjYztkN',
                'bokeh-1.4.0.min.js': 'mdMpUZqu5U0cV1pLU9Ap/3jthtPth7yWSJTu1ayRgk95qqjLewIkjntQDQDQA5cZ',
                'bokeh-api-1.4.0.js': 'Y3kNQHt7YjwAfKNIzkiQukIOeEGKzUU3mbSrraUl1KVfrlwQ3ZAMI1Xrw5o3Yg5V',
                'bokeh-api-1.4.0.min.js': '4oAJrx+zOFjxu9XLFp84gefY8oIEr75nyVh2/SLnyzzg9wR+mXXEi+xyy/HzfBLM',
                'bokeh-tables-1.4.0.js': 'I2iTMWMyfU/rzKXWJ2RHNGYfsXnyKQ3YjqQV2RvoJUJCyaGBrp0rZcWiTAwTc9t6',
                'bokeh-tables-1.4.0.min.js': 'pj14Cq5ZSxsyqBh+pnL2wlBS3UX25Yz1gVxqWkFMCExcnkN3fl4mbOF8ZUKyh7yl',
                'bokeh-widgets-1.4.0.js': 'scpWAebHEUz99AtveN4uJmVTHOKDmKWnzyYKdIhpXjrlvOwhIwEWUrvbIHqA0ke5',
                'bokeh-widgets-1.4.0.min.js': 'xR3dSxvH5hoa9txuPVrD63jB1LpXhzFoo0ho62qWRSYZVdyZHGOchrJX57RwZz8l'
            }

    .. _Subresource Integrity: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

    """
    if version not in _ALL_SRI_HASHES:
        try:
            with open(ROOT_DIR / "_sri" / f"{version}.json") as f:
                _ALL_SRI_HASHES[version] = json.load(f)
        except Exception as e:
            raise ValueError(f"Missing SRI hash for version {version}") from e
    return _ALL_SRI_HASHES[version]


def verify_sri_hashes() -> None:
    """ Verify the SRI hashes in a full release package.

    This function compares the computed SRI hashes for the BokehJS files in a
    full release package to the values in the SRI manifest file. Returns None
    if all hashes match, otherwise an exception will be raised.

    .. note::
        This function can only be called on full release (e.g "1.2.3") packages.

    Returns:
        None

    Raises:
        ValueError
            If called outside a full release package
        RuntimeError
            If there are missing, extra, or mismatched files

    """
    if not is_full_release():
        raise ValueError("verify_sri_hashes() can only be used with full releases")

    paths = list((settings.bokehjs_path() / "js").glob("bokeh*.js"))
    hashes = get_sri_hashes_for_version(__version__)

    if len(hashes) < len(paths):
        raise RuntimeError("There are unexpected 'bokeh*.js' files in the package")

    if len(hashes) > len(paths):
        raise RuntimeError("There are 'bokeh*.js' files missing in the package")

    bad: list[Path] = []
    for path in paths:
        name, suffix = str(path.name).split(".", 1)
        filename = f"{name}-{__version__}.{suffix}"
        sri_hash = _compute_single_hash(path)
        if hashes[filename] != sri_hash:
            bad.append(path)

    if bad:
        raise RuntimeError(f"SRI Hash mismatches in the package: {bad!r}")

PathVersioner = Callable[[str], str]

Kind = Literal["css", "js"]

@dataclass
class RuntimeMessage:
    type: Literal["warn"]
    text: str

# XXX: https://github.com/python/mypy/issues/5485
class UrlsFn(Protocol):
    @staticmethod
    def __call__(components: list[str], kind: Kind) -> list[str]: ...

class HashesFn(Protocol):
    @staticmethod
    def __call__(components: list[str], kind: Kind) -> Hashes: ...

@dataclass
class Urls:
    urls: UrlsFn
    messages: list[RuntimeMessage] = field(default_factory=list)
    hashes: HashesFn | None = None

ResourceAttr = Literal["__css__", "__javascript__"]

class Resources:
    """
    The Resources class encapsulates information relating to loading or
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

    _default_root_dir = Path(os.curdir)
    _default_root_url = DEFAULT_SERVER_HTTP_URL

    mode: BaseMode
    messages: list[RuntimeMessage]

    _log_level: LogLevel

    components: list[Component]

    _component_defs: ClassVar[ComponentDefs] = {
        "js": ["bokeh", "bokeh-gl", "bokeh-widgets", "bokeh-tables", "bokeh-mathjax", "bokeh-api"],
        "css": [],
    }

    _default_components: ClassVar[list[Component]] = ["bokeh", "bokeh-gl", "bokeh-widgets", "bokeh-tables", "bokeh-mathjax"]

    def __init__(
        self,
        mode: ResourcesMode | None = None,
        *,
        version: str | None = None,
        root_dir: PathLike | None = None,
        dev: bool | None = None,
        minified: bool | None = None,
        log_level: LogLevel | None = None,
        root_url: str | None = None,
        path_versioner: PathVersioner | None = None,
        components: list[Component] | None = None,
        base_dir: PathLike | None = None,
    ):
        self.components = components if components is not None else list(self._default_components)
        mode = settings.resources(mode)

        mode_dev = mode.endswith("-dev")
        self.dev = dev if dev is not None else settings.dev or mode_dev
        self.mode = cast(BaseMode, mode[:-4] if mode_dev else mode)

        if self.mode not in get_args(BaseMode):
            raise ValueError(
                "wrong value for 'mode' parameter, expected "
                f"'inline', 'cdn', 'server(-dev)', 'relative(-dev)' or 'absolute(-dev)', got {mode}",
            )

        if root_dir and not self.mode.startswith("relative"):
            raise ValueError("setting 'root_dir' makes sense only when 'mode' is set to 'relative'")

        if version and not self.mode.startswith("cdn"):
            raise ValueError("setting 'version' makes sense only when 'mode' is set to 'cdn'")

        if root_url and not self.mode.startswith("server"):
            raise ValueError("setting 'root_url' makes sense only when 'mode' is set to 'server'")

        self.root_dir = settings.rootdir(root_dir)
        del root_dir
        self.version = settings.cdn_version(version)
        del version
        if minified is None and self.dev:
            minified = False
        self.minified = settings.minified(minified)
        del minified
        self.log_level = settings.log_level(log_level)
        del log_level
        self.path_versioner = path_versioner
        del path_versioner

        if root_url and not root_url.endswith("/"):
            # root_url should end with a /, adding one
            root_url = root_url + "/"
        self._root_url = root_url

        self.messages = []

        match self.mode:
            case "cdn":
                cdn = self._cdn_urls()
                self.messages.extend(cdn.messages)
            case "server":
                server = self._server_urls()
                self.messages.extend(server.messages)

        self.base_dir = Path(base_dir) if base_dir is not None else settings.bokehjs_path()

    def clone(self, *, components: list[Component] | None = None) -> Resources:
        """ Make a clone of a resources instance allowing to override its components. """
        return Resources(
            mode=self.mode,
            version=self.version,
            root_dir=self.root_dir,
            dev=self.dev,
            minified=self.minified,
            log_level=self.log_level,
            root_url=self._root_url,
            path_versioner=self.path_versioner,
            components=components if components is not None else list(self.components),
            base_dir=self.base_dir,
        )

    def __repr__(self) -> str:
        args = [f"mode={self.mode!r}"]
        if self.dev:
            args.append("dev=True")
        if self.components != self._default_components:
            args.append(f"components={self.components!r}")
        return f"Resources({', '.join(args)})"

    __str__ = __repr__

    @classmethod
    def build(cls, resources: ResourcesLike | None = None) -> Resources:
        if isinstance(resources, Resources):
            return resources
        else:
            return Resources(mode=settings.resources(resources))

    # Properties --------------------------------------------------------------

    @property
    def log_level(self) -> LogLevel:
        return self._log_level

    @log_level.setter
    def log_level(self, level: LogLevel) -> None:
        valid_levels = get_args(LogLevel)
        if not (level is None or level in valid_levels):
            raise ValueError(f"Unknown log level '{level}', valid levels are: {valid_levels}")
        self._log_level = level

    @property
    def root_url(self) -> str:
        if self._root_url is not None:
            return self._root_url
        else:
            return self._default_root_url

    # Public methods ----------------------------------------------------------

    def components_for(self, kind: Kind) -> list[Component]:
        return [comp for comp in self.components if comp in self._component_defs[kind]]

    def _file_paths(self, kind: Kind) -> list[Path]:
        minified = ".min" if self.minified else ""

        files = [f"{component}{minified}.{kind}" for component in self.components_for(kind)]
        paths = [self.base_dir / kind / file for file in files]
        return paths

    def _collect_external_resources(self, resource_attr: ResourceAttr) -> list[str]:
        """ Collect external resources set on resource_attr attribute of all models."""
        external_resources: list[str] = []

        for _, cls in sorted(Model.model_class_reverse_map.items(), key=lambda arg: arg[0]):
            external: list[str] | str | None = getattr(cls, resource_attr, None)

            match external:
                case str():
                    if external not in external_resources:
                        external_resources.append(external)
                case list():
                    for e in external:
                        if e not in external_resources:
                            external_resources.append(e)

        return external_resources

    def _cdn_urls(self) -> Urls:
        return _get_cdn_urls(self.version, self.minified)

    def _server_urls(self) -> Urls:
        return _get_server_urls(self.root_url, self.minified, self.path_versioner)

    def _resolve(self, kind: Kind) -> tuple[list[str], list[str], Hashes]:
        paths = self._file_paths(kind)
        files, raw = [], []
        hashes = {}

        match self.mode:
            case "inline":
                raw = [self._inline(path) for path in paths]
            case "relative":
                root_dir = self.root_dir or self._default_root_dir
                files = [str(relpath(path, root_dir)) for path in paths]
            case "absolute":
                files = list(map(str, paths))
            case "cdn":
                cdn = self._cdn_urls()
                files = list(cdn.urls(self.components_for(kind), kind))
                if cdn.hashes:
                    hashes = cdn.hashes(self.components_for(kind), kind)
            case "server":
                server = self._server_urls()
                files = list(server.urls(self.components_for(kind), kind))

        return (files, raw, hashes)

    @staticmethod
    def _inline(path: Path) -> str:
        filename = path.name
        begin = f"/* BEGIN {filename} */"
        with open(path, "rb") as f:
            middle = f.read().decode("utf-8")
        end = f"/* END {filename} */"
        return f"{begin}\n{middle}\n{end}"

    @property
    def js_files(self) -> list[str]:
        files, _, _ = self._resolve("js")
        external_resources = self._collect_external_resources("__javascript__")
        return external_resources + files

    @property
    def js_raw(self) -> list[str]:
        _, raw, _ = self._resolve("js")

        if self.log_level is not None:
            raw.append(f'Bokeh.set_log_level("{self.log_level}");')

        if self.dev:
            raw.append("Bokeh.settings.dev = true")

        return raw

    @property
    def hashes(self) -> Hashes:
        _, _, hashes = self._resolve("js")
        return hashes

    def render_js(self) -> str:
        return JS_RESOURCES.render(js_raw=self.js_raw, js_files=self.js_files, hashes=self.hashes)


    @property
    def css_files(self) -> list[str]:
        files, _, _ = self._resolve("css")
        external_resources = self._collect_external_resources("__css__")
        return external_resources + files

    @property
    def css_raw(self) -> list[str]:
        _, raw, _ = self._resolve("css")
        return raw

    @property
    def css_raw_str(self) -> list[str]:
        return [json.dumps(css) for css in self.css_raw]

    def render_css(self) -> str:
        return CSS_RESOURCES.render(css_raw=self.css_raw, css_files=self.css_files)

    def render(self) -> str:
        css, js = self.render_css(), self.render_js()
        return f"{css}\n{js}"

class SessionCoordinates:
    """ Internal class used to parse kwargs for server URL, app_path, and session_id."""

    _url: str
    _session_id: ID | None

    def __init__(self, *, url: str = DEFAULT_SERVER_HTTP_URL, session_id: ID | None = None) -> None:
        self._url = url

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
    def session_id(self) -> ID:
        """ Session ID derived from the kwargs provided."""
        if self._session_id is None:
            self._session_id = generate_session_id()
        return self._session_id

    @property
    def session_id_allowing_none(self) -> ID | None:
        """ Session ID provided in kwargs, keeping it None if it hasn't been generated yet.

        The purpose of this is to preserve ``None`` as long as possible... in some cases
        we may never generate the session ID because we generate it on the server.
        """
        return self._session_id

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------

_DEV_PAT = re.compile(r"^(\d)+\.(\d)+\.(\d)+(\.dev|rc)")


def _cdn_base_url() -> str:
    return "https://cdn.bokeh.org"


def _get_cdn_urls(version: str | None = None, minified: bool = True) -> Urls:
    if version is None:
        docs_cdn = settings.docs_cdn()
        version = docs_cdn if docs_cdn else __version__.split("+")[0]

    base_url = _cdn_base_url()

    container = "bokeh/dev" if _DEV_PAT.match(version) else "bokeh/release"

    def mk_filename(comp: str, kind: Kind) -> str:
        return f"{comp}-{version}{'.min' if minified else ''}.{kind}"

    def mk_url(comp: str, kind: Kind) -> str:
        return f"{base_url}/{container}/" + mk_filename(comp, kind)

    result = Urls(urls=lambda components, kind: [mk_url(component, kind) for component in components])

    if len(__version__.split("+")) > 1:
        result.messages.append(RuntimeMessage(
            type="warn",
            text=(
                f"Requesting CDN BokehJS version '{version}' from local development version '{__version__}'. "
                "This configuration is unsupported and may not work!"
            ),
        ))

    if is_full_release(version): # TODO: TypeGuard?
        assert version is not None
        sri_hashes = get_sri_hashes_for_version(version)
        result.hashes = lambda components, kind: {
            mk_url(component, kind): sri_hashes[mk_filename(component, kind)] for component in components
        }

    return result


def _get_server_urls(
    root_url: str = DEFAULT_SERVER_HTTP_URL,
    minified: bool = True,
    path_versioner: PathVersioner | None = None,
) -> Urls:
    _minified = ".min" if minified else ""

    def mk_url(comp: str, kind: Kind) -> str:
        path = f"{kind}/{comp}{_minified}.{kind}"
        if path_versioner is not None:
            path = path_versioner(path)
        return f"{root_url}static/{path}"

    return Urls(urls=lambda components, kind: [mk_url(component, kind) for component in components])


def _compute_single_hash(path: Path) -> str:
    assert path.suffix == ".js"

    from subprocess import PIPE, Popen

    digest = f"openssl dgst -sha384 -binary {path}".split()
    p1 = Popen(digest, stdout=PIPE)

    b64 = "openssl base64 -A".split()
    p2 = Popen(b64, stdin=p1.stdout, stdout=PIPE)

    out, _ = p2.communicate()
    return out.decode("utf-8").strip()

# -----------------------------------------------------------------------------
# Code
# -----------------------------------------------------------------------------

ResourcesLike: TypeAlias = Resources | ResourcesMode

CDN = Resources(mode="cdn")

INLINE = Resources(mode="inline")

__all__ = (
    "CDN",
    "INLINE",
    "Resources",
    "get_all_sri_versions",
    "get_sri_hashes_for_version",
    "verify_sri_hashes",
)
