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

# Bokeh imports
from . import __version__
from .core.templates import CSS_RESOURCES, JS_RESOURCES
from .model import Model
from .settings import settings
from .util.paths import ROOT_DIR, bokehjsdir
from .util.token import generate_session_id
from .util.version import is_full_release

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

DEFAULT_SERVER_HOST = "localhost"
DEFAULT_SERVER_PORT = 5006
DEFAULT_SERVER_HTTP_URL = "http://%s:%d/" % (DEFAULT_SERVER_HOST, DEFAULT_SERVER_PORT)

# __all__ defined at the bottom on the class module

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------


_SRI_HASHES = None


def get_all_sri_hashes():
    """ Report SRI script hashes for all versions of BokehJS.

    Bokeh provides `Subresource Integrity`_ hashes for all JavaScript files that
    are published to CDN for full releases. This function returns a dictionary
    that maps version strings to sub-dictionaries that JavaScipt filenames to
    their hashes.

    Returns:
        dict

    Example:

        The returned dict will map version strings to sub-dictionaries for each
        version:

        .. code-block:: python

            {
                '1.4.0': {
                    'bokeh-1.4.0.js': 'vn/jmieHiN+ST+GOXzRU9AFfxsBp8gaJ/wvrzTQGpIKMsdIcyn6U1TYtvzjYztkN',
                    'bokeh-1.4.0.min.js': 'mdMpUZqu5U0cV1pLU9Ap/3jthtPth7yWSJTu1ayRgk95qqjLewIkjntQDQDQA5cZ',
                    ...
                }
                '1.3.4': {
                    ...
                }
                ...
            }

    .. _Subresource Integrity: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

    """
    global _SRI_HASHES

    if not _SRI_HASHES:
        with open(join(ROOT_DIR, "_sri.json")) as f:
            _SRI_HASHES = json.load(f)

    return dict(_SRI_HASHES)


def get_sri_hashes_for_version(version):
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
        KeyError: if the specified version does not exist

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
    hashes = get_all_sri_hashes()
    return hashes[version]


def verify_sri_hashes():
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

    from glob import glob
    paths = glob(join(bokehjsdir(), "js/bokeh*.js"))

    hashes = get_sri_hashes_for_version(__version__)

    if len(hashes) < len(paths):
        raise RuntimeError("There are unexpected 'bokeh*.js' files in the package")

    if len(hashes) > len(paths):
        raise RuntimeError("There are 'bokeh*.js' files missing in the package")

    bad = []
    for path in paths:
        name, suffix = basename(path).split(".", 1)
        filename = f"{name}-{__version__}.{suffix}"
        sri_hash = _compute_single_hash(path)
        if hashes[filename] != sri_hash:
            bad.append(path)

    if bad:
        raise RuntimeError(f"SRI Hash mismatches in the package: {bad!r}")

class BaseResources:
    _default_root_dir = "."
    _default_root_url = DEFAULT_SERVER_HTTP_URL

    def __init__(
        self,
        mode=None,
        version=None,
        root_dir=None,
        minified=None,
        legacy=None,
        log_level=None,
        root_url=None,
        path_versioner=None,
        components=None,
        base_dir=None,
    ):

        self._components = components

        if hasattr(self, "_js_components"):
            self.js_components = self._js_components
        if hasattr(self, "_css_components"):
            self.css_components = self._css_components

        self.mode = settings.resources(mode)
        del mode

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
    def log_level(self):
        return self._log_level

    @log_level.setter
    def log_level(self, level):
        valid_levels = ["trace", "debug", "info", "warn", "error", "fatal"]
        if not (level is None or level in valid_levels):
            raise ValueError("Unknown log level '{}', valid levels are: {}".format(level, str(valid_levels)))
        self._log_level = level

    @property
    def root_url(self):
        if self._root_url is not None:
            return self._root_url
        else:
            return self._default_root_url

    # Public methods ----------------------------------------------------------

    def components(self, kind):
        components = self.js_components if kind == "js" else self.css_components
        if self._components is not None:
            components = [c for c in components if c in self._components]
        return components

    def _file_paths(self, kind):
        minified = ".min" if not self.dev and self.minified else ""
        legacy = ".legacy" if self.legacy else ""

        files = [f"{component}{legacy}{minified}.{kind}" for component in self.components(kind)]
        paths = [join(self.base_dir, kind, file) for file in files]
        return paths

    def _collect_external_resources(self, resource_attr):
        """ Collect external resources set on resource_attr attribute of all models."""

        external_resources = []

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

    def _cdn_urls(self):
        return _get_cdn_urls(self.version, self.minified, self.legacy)

    def _server_urls(self):
        return _get_server_urls(self.root_url, False if self.dev else self.minified, self.legacy, self.path_versioner)

    def _resolve(self, kind):
        paths = self._file_paths(kind)
        files, raw = [], []
        hashes = {}

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
            if cdn["hashes"]:
                hashes = cdn["hashes"](self.components(kind), kind)
        elif self.mode == "server":
            server = self._server_urls()
            files = list(server["urls"](self.components(kind), kind))

        return (files, raw, hashes)

    @staticmethod
    def _inline(path):
        begin = "/* BEGIN %s */" % basename(path)
        with open(path, "rb") as f:
            middle = f.read().decode("utf-8")
        end = "/* END %s */" % basename(path)
        return "%s\n%s\n%s" % (begin, middle, end)


class JSResources(BaseResources):
    """ The Resources class encapsulates information relating to loading or embedding Bokeh Javascript.

    Args:
        mode (str) : How should Bokeh JS be included in output

            See below for descriptions of available modes

        version (str, optional) : what version of Bokeh JS to load

            Only valid with the ``'cdn'`` mode

        root_dir (str, optional) : root directory for loading Bokeh JS assets

            Only valid with ``'relative'`` and ``'relative-dev'`` modes

        minified (bool, optional) : whether JavaScript should be minified or not (default: True)

        root_url (str, optional) : URL and port of Bokeh Server to load resources from (default: None)

            If ``None``, absolute URLs based on the default server configuration will
            be generated.

            ``root_url`` can also be the empty string, in which case relative URLs,
            e.g., "static/js/bokeh.min.js", are generated.

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
        css_raw : any raw CSS that needs to be places inside ``<style>`` tags
        css_files : URLs of any CSS files that need to be loaded by ``<link>`` tags
        messages : any informational messages concerning this configuration

    These attributes are often useful as template parameters when embedding
    Bokeh plots.

    """

    _js_components = ["bokeh", "bokeh-widgets", "bokeh-tables"]

    # Properties --------------------------------------------------------------

    @property
    def js_files(self):
        files, _, __ = self._resolve("js")
        external_resources = self._collect_external_resources("__javascript__")
        return external_resources + files

    @property
    def js_raw(self):
        _, raw, __ = self._resolve("js")

        if self.log_level is not None:
            raw.append('Bokeh.set_log_level("%s");' % self.log_level)

        if self.dev:
            raw.append("Bokeh.settings.dev = true")

        return raw

    @property
    def hashes(self):
        _, __, hashes = self._resolve("js")
        return hashes

    # Public methods ----------------------------------------------------------

    def render_js(self):
        return JS_RESOURCES.render(js_raw=self.js_raw, js_files=self.js_files, hashes=self.hashes)


class CSSResources(BaseResources):
    """ The CSSResources class encapsulates information relating to loading or embedding Bokeh client-side CSS.

    Args:
        mode (str) : how should Bokeh CSS be included in output

            See below for descriptions of available modes

        version (str, optional) : what version of Bokeh CSS to load

            Only valid with the ``'cdn'`` mode

        root_dir (str, optional) : root directory for loading BokehJS resources

            Only valid with ``'relative'`` and ``'relative-dev'`` modes

        minified (bool, optional) : whether CSS should be minified or not (default: True)

        root_url (str, optional) : URL and port of Bokeh Server to load resources from

            Only valid with ``'server'`` and ``'server-dev'`` modes

    The following **mode** values are available for configuring a Resource object:

    * ``'inline'`` configure to provide entire BokehJS code and CSS inline
    * ``'cdn'`` configure to load Bokeh CSS from ``https://cdn.bokeh.org``
    * ``'server'`` configure to load from a Bokeh Server
    * ``'server-dev'`` same as ``server`` but supports non-minified CSS
    * ``'relative'`` configure to load relative to the given directory
    * ``'relative-dev'`` same as ``relative`` but supports non-minified CSS
    * ``'absolute'`` configure to load from the installed Bokeh library static directory
    * ``'absolute-dev'`` same as ``absolute`` but supports non-minified CSS

    Once configured, a Resource object exposes the following public attributes:

    Attributes:
        css_raw : any raw CSS that needs to be places inside ``<style>`` tags
        css_files : URLs of any CSS files that need to be loaded by ``<link>`` tags
        messages : any informational messages concerning this configuration

    These attributes are often useful as template parameters when embedding Bokeh plots.

    """

    _css_components = []

    # Properties --------------------------------------------------------------

    @property
    def css_files(self):
        files, _, __ = self._resolve("css")
        external_resources = self._collect_external_resources("__css__")
        return external_resources + files

    @property
    def css_raw(self):
        _, raw, __ = self._resolve("css")
        return raw

    @property
    def css_raw_str(self):
        return [json.dumps(css) for css in self.css_raw]

    # Public methods ----------------------------------------------------------

    def render_css(self):
        return CSS_RESOURCES.render(css_raw=self.css_raw, css_files=self.css_files)


class Resources(JSResources, CSSResources):
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

    # Public methods ----------------------------------------------------------

    def render(self):
        return "%s\n%s" % (self.render_css(), self.render_js())


# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------


class _SessionCoordinates:
    """ Internal class used to parse kwargs for server URL, app_path, and session_id."""

    def __init__(self, **kwargs):
        self._url = kwargs.get("url", DEFAULT_SERVER_HTTP_URL)

        if self._url is None:
            raise ValueError("url cannot be None")

        if self._url == "default":
            self._url = DEFAULT_SERVER_HTTP_URL

        if self._url.startswith("ws"):
            raise ValueError("url should be the http or https URL for the server, not the websocket URL")

        self._url = self._url.rstrip("/")

        # we lazy-generate the session_id so we can generate it server-side when appropriate
        self._session_id = kwargs.get("session_id")

    # Properties --------------------------------------------------------------

    @property
    def url(self):
        return self._url

    @property
    def session_id(self):
        """ Session ID derived from the kwargs provided."""
        if self._session_id is None:
            self._session_id = generate_session_id()
        return self._session_id

    @property
    def session_id_allowing_none(self):
        """ Session ID provided in kwargs, keeping it None if it hasn't been generated yet.

        The purpose of this is to preserve ``None`` as long as possible... in some cases
        we may never generate the session ID because we generate it on the server.
        """
        return self._session_id


_DEV_PAT = re.compile(r"^(\d)+\.(\d)+\.(\d)+(dev|rc)")


def _cdn_base_url():
    return "https://cdn.bokeh.org"


def _get_cdn_urls(version=None, minified=True, legacy=False):
    if version is None:
        if settings.docs_cdn():
            version = settings.docs_cdn()
        else:
            version = __version__.split("-")[0]

    # check if we want minified js and css
    _minified = ".min" if minified else ""
    _legacy = ".legacy" if legacy else ""

    base_url = _cdn_base_url()
    dev_container = "bokeh/dev"
    rel_container = "bokeh/release"

    # check the 'dev' fingerprint
    container = dev_container if _DEV_PAT.match(version) else rel_container

    def mk_filename(comp, kind):
        return f"{comp}-{version}{_legacy}{_minified}.{kind}"

    def mk_url(comp, kind):
        return f"{base_url}/{container}/" + mk_filename(comp, kind)

    result = {
        "urls": lambda components, kind: [mk_url(component, kind) for component in components],
        "messages": [],
        "hashes" : None
    }

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

    if is_full_release(version):
        sri_hashes = get_sri_hashes_for_version(version)
        result['hashes'] = lambda components, kind: {mk_url(component, kind): sri_hashes[mk_filename(component, kind)] for component in components}

    return result


def _get_server_urls(root_url, minified=True, legacy=False, path_versioner=None):
    _minified = ".min" if minified else ""
    _legacy = ".legacy" if legacy else ""

    def mk_url(comp, kind):
        path = f"{kind}/{comp}{_legacy}{_minified}.{kind}"
        if path_versioner is not None:
            path = path_versioner(path)
        return f"{root_url}static/{path}"

    return {"urls": lambda components, kind: [mk_url(component, kind) for component in components], "messages": []}


def _compute_single_hash(path):
    assert path.endswith(".js")

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

CDN = Resources(mode="cdn")

INLINE = Resources(mode="inline")

INLINE_LEGACY = Resources(mode="inline", legacy=True)

__all__ = (
    "CDN",
    "INLINE",
    "INLINE_LEGACY",
    "Resources",
    "JSResources",
    "CSSResources",
    "get_all_sri_hashes",
    "get_sri_hashes_for_version",
    "verify_sri_hashes",
)
