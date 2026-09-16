# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""Resource delivery configuration and release hash utilities.

.. _Subresource Integrity: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity

"""

# -----------------------------------------------------------------------------
# Boilerplate
# -----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportArgumentType=false, reportReturnType=false

import logging  # isort:skip

log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

# Standard library imports
import json
import os
import re
from dataclasses import dataclass, field, replace
from functools import lru_cache
from pathlib import Path
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Final,
    Literal,
    Mapping,
    Protocol,
    Sequence,
    cast,
)
from urllib.parse import urlparse

# Bokeh imports
from . import __version__
from .settings import settings
from .util.paths import ROOT_DIR
from .util.token import generate_session_id
from .util.version import is_full_release

if TYPE_CHECKING:
    from .core.types import ID, PathLike
    from .embed.resources import ResolvedResources, ResourceRequirements

# -----------------------------------------------------------------------------
# Globals and constants
# -----------------------------------------------------------------------------

DEFAULT_SERVER_HOST = settings.default_server_host()
DEFAULT_SERVER_PORT = settings.default_server_port()

def server_url(host: str | None = None, port: int | None = None, ssl: bool = False) -> str:
    protocol = "https" if ssl else "http"
    return f"{protocol}://{host or DEFAULT_SERVER_HOST}:{port or DEFAULT_SERVER_PORT}/"

DEFAULT_SERVER_HTTP_URL = server_url()

type ResourceComponent = Literal[
    "bokeh/core",
    "bokeh/widgets",
    "bokeh/tables",
    "bokeh/webgl",
    "bokeh/mathjax",
    "bokeh/api",
]

type ResourcesMode = Literal[
    "none",
    "inline",
    "offline",
    "cdn",
    "server",
    "relative",
    "absolute",
]

PathVersioner = Callable[[str], str]

_RESOURCE_MODES = ("none", "inline", "offline", "cdn", "server", "relative", "absolute")

_COMPONENT_NAMES: dict[ResourceComponent, str] = {
    "bokeh/core": "bokeh",
    "bokeh/widgets": "bokeh-widgets",
    "bokeh/tables": "bokeh-tables",
    "bokeh/webgl": "bokeh-gl",
    "bokeh/mathjax": "bokeh-mathjax",
    "bokeh/api": "bokeh-api",
}

# These names preserve the common ``resources=CDN`` and ``resources=INLINE``
# spelling without retaining the legacy stateful resource objects.
CDN: Final[Literal["cdn"]] = "cdn"
INLINE: Final[Literal["inline"]] = "inline"

# __all__ defined at the bottom on the class module

# -----------------------------------------------------------------------------
# General API
# -----------------------------------------------------------------------------

class ResourceConflictError(ValueError):
    """Raised when resources cannot satisfy artifact requirements."""


@dataclass(frozen=True)
class Resources:
    '''Host-owned rules for satisfying artifact resource requirements.

    ``none`` emits nothing and assigns complete responsibility to the host.
    ``offline`` permits only inline/local content and rejects external URLs.
    Other modes resolve matching Bokeh bundles through CDN, server, filesystem,
    or explicit paths. CSP and SRI choices belong to resources rather than the
    reusable artifact. Bundle versions always come from the artifact.
    '''
    mode: ResourcesMode = "cdn"
    minified: bool = True
    root_url: str | None = None
    root_dir: PathLike | None = None
    base_dir: PathLike | None = None
    nonce: str | None = None
    crossorigin: str | None = None
    integrity: bool = False
    external_only: bool = False
    path_versioner: PathVersioner | None = field(default=None, repr=False, compare=False)

    def __post_init__(self) -> None:
        if self.mode not in _RESOURCE_MODES:
            raise ResourceConflictError(
                f"unknown resource mode {self.mode!r}; expected one of {_RESOURCE_MODES!r}",
            )
        if self.mode in ("inline", "offline") and self.external_only:
            raise ResourceConflictError(
                f"resource mode '{self.mode}' emits inline assets and conflicts with external_only=True",
            )
        if self.integrity and self.mode != "cdn":
            raise ResourceConflictError("subresource integrity is only available for CDN resources")
        if self.root_url is not None and self.mode != "server":
            raise ResourceConflictError("root_url is only valid for server resources")
        if self.root_dir is not None and self.mode != "relative":
            raise ResourceConflictError("root_dir is only valid for relative resources")
        if self.path_versioner is not None and self.mode != "server":
            raise ResourceConflictError("path_versioner is only valid for server resources")
        if self.root_dir is not None and not isinstance(self.root_dir, Path):
            object.__setattr__(self, "root_dir", Path(self.root_dir))
        if self.base_dir is not None and not isinstance(self.base_dir, Path):
            object.__setattr__(self, "base_dir", Path(self.base_dir))
        if self.root_url is not None and not self.root_url.endswith("/"):
            object.__setattr__(self, "root_url", f"{self.root_url}/")

    @classmethod
    def build(cls, value: Resources | str | None = None, **overrides: Any) -> Resources:
        '''Normalize a resources specification.

        Args:
            value: A resources object, mode name, or ``None``.
            overrides: Fields that override the supplied value.

        Returns:
            The normalized resources configuration.
        '''
        if value is None:
            value = settings.resources()
            overrides.setdefault("minified", settings.minified())
        if isinstance(value, Resources):
            if not overrides:
                return value
            return replace(value, **overrides)
        if value.endswith("-dev"):
            value = value.removesuffix("-dev")
            overrides["minified"] = False
        mode = cast(ResourcesMode, value)
        return cls(mode=mode, **overrides)

    def to_dict(self) -> dict[str, Any]:
        '''Return the JSON-compatible resources configuration.'''
        result: dict[str, Any] = {
            "mode": self.mode,
            "minified": self.minified,
        }
        for name in ("root_url", "nonce", "crossorigin"):
            value = getattr(self, name)
            if value is not None:
                result[name] = value
        if self.root_dir is not None:
            result["root_dir"] = str(self.root_dir)
        if self.base_dir is not None:
            result["base_dir"] = str(self.base_dir)
        for name in ("integrity", "external_only"):
            value = getattr(self, name)
            if value:
                result[name] = value
        return result

    def resolve(self, requirements: ResourceRequirements, *, bokeh_version: str = __version__) -> ResolvedResources:
        '''Resolve exact requirements or raise an actionable conflict.'''
        from .embed.resources import ResolvedResource, ResolvedResources

        if self.mode == "none":
            return ResolvedResources(requirements, self, bokeh_version)

        component_names = [_COMPONENT_NAMES[component] for component in requirements.components]
        js_files, js_raw, hashes = self._resolve_bokeh_assets(
            component_names, "js", bokeh_version=bokeh_version,
        )
        css_files, css_raw, _ = self._resolve_bokeh_assets(
            [], "css", bokeh_version=bokeh_version,
        )
        assets: list[ResolvedResource] = []

        for url in js_files:
            integrity = _integrity_for_url(url, hashes) if self.integrity else None
            if self.integrity and integrity is None:
                raise ResourceConflictError(f"no SRI hash is available for required resource {url!r}")
            assets.append(ResolvedResource(
                "script", url=url, integrity=integrity,
                crossorigin=self.crossorigin or ("anonymous" if integrity else None), nonce=self.nonce,
            ))
        assets.extend(ResolvedResource("script", content=content, nonce=self.nonce) for content in js_raw)
        for url in css_files:
            integrity = _integrity_for_url(url, hashes) if self.integrity else None
            if self.integrity and integrity is None:
                raise ResourceConflictError(f"no SRI hash is available for required resource {url!r}")
            assets.append(ResolvedResource(
                "style", url=url, integrity=integrity,
                crossorigin=self.crossorigin or ("anonymous" if integrity else None), nonce=self.nonce,
            ))
        assets.extend(ResolvedResource("style", content=content, nonce=self.nonce) for content in css_raw)

        for extension in requirements.extensions:
            for requirement in extension.assets:
                if self.mode == "offline" and requirement.url is not None:
                    raise ResourceConflictError(
                        f"offline resources cannot load external {requirement.kind} {requirement.url!r} "
                        f"required by extension {extension.name!r}; provide inline extension content",
                    )
                if self.mode == "inline" and requirement.url is not None:
                    raise ResourceConflictError(
                        f"inline resources cannot inline {requirement.url!r} required by extension {extension.name!r}; "
                        "declare the extension asset content or choose an external mode",
                    )
                if self.external_only and requirement.content is not None:
                    raise ResourceConflictError(
                        f"external_only resources reject inline {requirement.kind} required by extension {extension.name!r}",
                    )
                if self.integrity and requirement.url is not None and requirement.integrity is None:
                    raise ResourceConflictError(
                        f"integrity requires an SRI hash for extension resource {requirement.url!r}",
                    )
                assets.append(ResolvedResource(
                    requirement.kind,
                    url=requirement.url,
                    content=requirement.content,
                    integrity=requirement.integrity,
                    crossorigin=requirement.crossorigin or self.crossorigin or (
                        "anonymous" if requirement.integrity is not None else None
                    ),
                    nonce=self.nonce,
                    module=requirement.module,
                ))

        identities: dict[tuple[str, str], tuple[Any, ...]] = {}
        deduplicated: list[ResolvedResource] = []
        for asset in assets:
            locator = asset.url if asset.url is not None else asset.content
            assert locator is not None
            key = (asset.kind, locator)
            previous = identities.get(key)
            if previous is not None and previous != asset.identity:
                raise ResourceConflictError(f"conflicting declarations for {asset.kind} resource {locator!r}")
            if previous is None:
                identities[key] = asset.identity
                deduplicated.append(asset)

        return ResolvedResources(requirements, self, bokeh_version, tuple(deduplicated))

    def _resolve_bokeh_assets(self, components: Sequence[str], kind: Literal["js", "css"], *,
            bokeh_version: str) -> tuple[list[str], list[str], Mapping[str, str]]:
        suffix = ".min" if self.minified else ""
        base_dir = Path(self.base_dir) if self.base_dir is not None else settings.bokehjs_path()
        paths = [base_dir / kind / f"{component}{suffix}.{kind}" for component in components]
        mode = "inline" if self.mode == "offline" else self.mode

        if mode == "inline":
            return [], [_inline_resource(path) for path in paths], {}
        if mode == "relative":
            configured_root = self.root_dir or settings.rootdir()
            root_dir = Path(configured_root) if configured_root is not None else Path(os.curdir)
            return [os.path.relpath(path, root_dir).replace("\\", "/") for path in paths], [], {}
        if mode == "absolute":
            return [str(path) for path in paths], [], {}
        if mode == "cdn":
            urls = _get_cdn_urls(bokeh_version.split("+", 1)[0], self.minified)
            files = urls.urls(components, kind)
            hashes = urls.hashes(components, kind) if urls.hashes is not None else {}
            return files, [], hashes
        if mode == "server":
            urls = _get_server_urls(
                self.root_url or DEFAULT_SERVER_HTTP_URL,
                self.minified,
                self.path_versioner,
            )
            return urls.urls(components, kind), [], {}
        raise AssertionError(f"unexpected resource mode {self.mode!r}")

# -----------------------------------------------------------------------------
# Dev API
# -----------------------------------------------------------------------------

type Hashes = dict[str, str]

_ALL_SRI_HASHES: dict[str, Hashes] = {}

def get_all_sri_versions() -> set[str]:
    """ Report all versions that have SRI hashes.

    Returns:
        set

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

type Kind = Literal["css", "js"]

@dataclass
class RuntimeMessage:
    type: Literal["warn"]
    text: str

# XXX: https://github.com/python/mypy/issues/5485
class UrlsFn(Protocol):
    @staticmethod
    def __call__(components: Sequence[str], kind: Kind) -> list[str]: ...

class HashesFn(Protocol):
    @staticmethod
    def __call__(components: Sequence[str], kind: Kind) -> Hashes: ...

@dataclass
class Urls:
    urls: UrlsFn
    messages: list[RuntimeMessage] = field(default_factory=list)
    hashes: HashesFn | None = None

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


@lru_cache(maxsize=32)
def _cached_inline_resource(path: str, mtime_ns: int, size: int) -> str:
    del mtime_ns, size
    file_path = Path(path)
    filename = file_path.name
    return f"/* BEGIN {filename} */\n{file_path.read_text(encoding='utf-8')}\n/* END {filename} */"


def _inline_resource(path: Path) -> str:
    stat = path.stat()
    return _cached_inline_resource(str(path), stat.st_mtime_ns, stat.st_size)


def _integrity_for_url(url: str, hashes: Mapping[str, str]) -> str | None:
    filename = Path(urlparse(url).path).name
    value = hashes.get(url) or hashes.get(filename)
    return None if value is None else f"sha384-{value}"


def _compute_single_hash(path: Path) -> str:
    assert path.suffix == ".js"

    from subprocess import PIPE, Popen

    digest = f"openssl dgst -sha384 -binary {path}".split()
    p1 = Popen(digest, stdout=PIPE)

    b64 = "openssl base64 -A".split()
    p2 = Popen(b64, stdin=p1.stdout, stdout=PIPE)

    out, _ = p2.communicate()
    return out.decode("utf-8").strip()

__all__ = (
    "CDN",
    "INLINE",
    "ResourceConflictError",
    "Resources",
    "ResourcesMode",
    "get_all_sri_versions",
    "get_sri_hashes_for_version",
    "verify_sri_hashes",
)
