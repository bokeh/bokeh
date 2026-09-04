#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Versioned payloads shared by Bokeh's notebook backends. '''

from __future__ import annotations

# Standard library imports
import base64
import hashlib
import json
import re
import sys
import threading
from collections import OrderedDict
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import (
    Any,
    Literal,
    NotRequired,
    TypedDict,
)

# Bokeh imports
from .. import __version__
from ..embed.artifact import EMBED_ARTIFACT_MIME_TYPE, EmbedArtifact
from ..embed.resources import ResolvedResource, ResolvedResources
from ..util.version import _bokehjs_version

__all__ = (
    "ARTIFACT_MIME_TYPE",
    "DISPLAY_MIME_TYPE",
    "FILE_MIME_TYPE",
    "NOTEBOOK_COMM_TARGET",
    "notebook_info",
    "PROTOCOL_VERSION",
    "RESOURCE_COMM_TARGET",
    "RESOURCES_MIME_TYPE",
)

_PROTOCOL = json.loads((Path(__file__).parents[1] / "jupyter" / "protocol.json").read_text())
PROTOCOL_VERSION = _PROTOCOL["version"]
ARTIFACT_MIME_TYPE = EMBED_ARTIFACT_MIME_TYPE
DISPLAY_MIME_TYPE = _PROTOCOL["mime_types"]["display"]
FILE_MIME_TYPE = _PROTOCOL["mime_types"]["file"]
RESOURCES_MIME_TYPE = _PROTOCOL["mime_types"]["resources"]
NOTEBOOK_COMM_TARGET = _PROTOCOL["comm_targets"]["notebook"]
RESOURCE_COMM_TARGET = _PROTOCOL["comm_targets"]["resources"]

_NOTEBOOK_INFO_LABELS = {
    "python_version": "Python version",
    "python_executable": "Python executable",
    "bokeh_package_path": "Bokeh package path",
    "protocol_version": "Notebook protocol",
    "artifact_mime_type": "Artifact MIME type",
    "display_mime_type": "Display MIME type",
    "file_mime_type": "Saved-file MIME type",
    "resources_mime_type": "Resources MIME type",
}

class _NotebookInfo(dict[str, Any]):
    '''A normal diagnostic mapping with an IPython rich representation.'''

    def _repr_html_(self) -> str:
        from ..core.templates import NOTEBOOK_INFO

        logo_path = Path(__file__).parents[1] / "jupyter" / "logotype.svg"
        try:
            logo_data = base64.b64encode(logo_path.read_bytes()).decode("ascii")
        except OSError:
            logo_data = None

        anywidget = self.get("anywidget_available") is True
        marimo = self.get("marimo_runtime") is True
        if marimo and anywidget:
            integration: tuple[str, Literal["neutral", "success", "error"]] = ("Connected (AnyWidget)", "success")
        else:
            integration = ("Renderer negotiated per output", "neutral")

        kernel = self.get("interactive_kernel") is True
        comms = self.get("comm_manager") is True
        extension = self.get("labextension_packaged") is True
        if marimo and anywidget:
            environment: tuple[str, Literal["neutral", "success", "error"]] = ("marimo; AnyWidget connected", "success")
        elif not kernel:
            environment = ("No interactive kernel detected", "error")
        elif not comms:
            environment = ("Interactive kernel; comm unavailable", "error")
        else:
            environment = ("Interactive kernel; comm available", "success")

        resource_records = self.get("resource_records", 0)
        managed_applications = self.get("managed_applications", 0)
        technical_rows = [
            (_NOTEBOOK_INFO_LABELS[key], self.get(key))
            for key in (
                "python_version",
                "python_executable",
                "bokeh_package_path",
                "protocol_version",
                "artifact_mime_type",
                "display_mime_type",
                "file_mime_type",
                "resources_mime_type",
            )
        ]

        return NOTEBOOK_INFO.render(
            bokeh_version=self.get("bokeh_version", "unknown"),
            logo_data=logo_data,
            integration=integration,
            environment=environment,
            extension_available=extension,
            resource_records=resource_records,
            managed_applications=managed_applications,
            technical_rows=technical_rows,
        )

class _ArtifactPayload(TypedDict):
    id: str
    kind: Literal["js", "css"]
    source: Literal["url", "inline"]
    url: NotRequired[str]
    integrity: NotRequired[str]
    crossorigin: NotRequired[str]
    nonce: NotRequired[str]
    module: NotRequired[bool]
    core: NotRequired[bool]

class _ResourcePayload(TypedDict):
    protocol_version: int
    kind: Literal["resources"]
    resource_id: str
    mode: str
    bokeh_version: str
    python_version: str
    requirements: dict[str, Any]
    policy: dict[str, Any]
    dependencies: list[str]
    artifacts: list[_ArtifactPayload]
    warnings: list[str]
    load_timeout: int

class _DisplayPayload(TypedDict):
    protocol_version: int
    kind: Literal["artifact"]
    resource_id: str
    bokeh_version: str
    python_version: str
    artifact_fingerprint: str
    source_kind: Literal["standalone", "server"]
    view_id: str
    connect_timeout: int
    live_id: NotRequired[str]
    application_id: NotRequired[str]
    application_url: NotRequired[str]

class _FilePayload(TypedDict):
    protocol_version: int
    kind: Literal["file"]
    path: str

_ARTIFACT_DIGEST_CACHE: OrderedDict[str, str] = OrderedDict()
_ARTIFACT_DIGEST_CACHE_BYTES = 0
_ARTIFACT_DIGEST_CACHE_LIMIT = 16 * 1024 * 1024
_ARTIFACT_DIGEST_CACHE_LOCK = threading.Lock()

def _artifact_digest(value: str) -> str:
    global _ARTIFACT_DIGEST_CACHE_BYTES
    with _ARTIFACT_DIGEST_CACHE_LOCK:
        cached = _ARTIFACT_DIGEST_CACHE.get(value)
        if cached is not None:
            _ARTIFACT_DIGEST_CACHE.move_to_end(value)
            return cached
    encoded = value.encode()
    digest = hashlib.sha256(encoded).hexdigest()
    size = len(encoded)
    if size > _ARTIFACT_DIGEST_CACHE_LIMIT:
        return digest
    with _ARTIFACT_DIGEST_CACHE_LOCK:
        previous = _ARTIFACT_DIGEST_CACHE.pop(value, None)
        if previous is None:
            _ARTIFACT_DIGEST_CACHE_BYTES += size
        _ARTIFACT_DIGEST_CACHE[value] = digest
        while _ARTIFACT_DIGEST_CACHE_BYTES > _ARTIFACT_DIGEST_CACHE_LIMIT:
            source, _ = _ARTIFACT_DIGEST_CACHE.popitem(last=False)
            _ARTIFACT_DIGEST_CACHE_BYTES -= len(source.encode())
    return digest

def _resource_value(resource: ResolvedResource) -> str:
    value = resource.url if resource.url is not None else resource.content
    assert value is not None
    return value


def _artifact(resource: ResolvedResource) -> _ArtifactPayload:
    kind: Literal["js", "css"] = "js" if resource.kind == "script" else "css"
    source: Literal["url", "inline"] = "url" if resource.url is not None else "inline"
    value = _resource_value(resource)
    core = kind == "js" and re.search(r"(?:BEGIN |/|^)bokeh(?:-[0-9][^/]*)?(?:\.min)?\.js(?: \*/|\?|$)", value) is not None
    identity = {
        "kind": kind,
        "source": source,
        "value": _artifact_digest(value),
        "integrity": resource.integrity,
        "crossorigin": resource.crossorigin,
        "nonce": resource.nonce,
        "module": resource.module,
        "core": core,
    }
    digest = hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest()
    artifact = _ArtifactPayload(id=f"{kind}-{source}-{digest}", kind=kind, source=source)
    if resource.url is not None:
        artifact["url"] = resource.url
    for name in ("integrity", "crossorigin", "nonce"):
        if (item := getattr(resource, name)) is not None:
            artifact[name] = item
    if resource.module:
        artifact["module"] = True
    if core:
        artifact["core"] = True
    return artifact


def _resource_payload(resolved: ResolvedResources, load_timeout: int, *,
        dependencies: list[str] | None = None, assets: tuple[ResolvedResource, ...] | None = None) -> _ResourcePayload:
    '''Describe one explicit common-policy resource delta for a notebook host.'''
    selected = resolved.assets if assets is None else assets
    artifacts = [_artifact(resource) for resource in selected]
    descriptor = {
        "bokeh_version": _bokehjs_version(resolved.bokeh_version),
        "policy": resolved.policy.to_dict(),
        "requirements": resolved.requirements.to_dict(),
        "dependencies": dependencies or [],
        "artifacts": [item["id"] for item in artifacts],
    }
    digest = hashlib.sha256(json.dumps(descriptor, sort_keys=True).encode()).hexdigest()[:16]
    return _ResourcePayload(
        protocol_version=PROTOCOL_VERSION,
        kind="resources",
        resource_id=f"bokeh-{digest}",
        mode=resolved.policy.mode,
        bokeh_version=_bokehjs_version(resolved.bokeh_version),
        python_version=__version__,
        requirements=resolved.requirements.to_dict(),
        policy=resolved.policy.to_dict(),
        dependencies=dependencies or [],
        artifacts=artifacts,
        warnings=[],
        load_timeout=load_timeout,
    )

def _resource_artifact_ids(resolved: ResolvedResources) -> list[str]:
    return [_artifact(resource)["id"] for resource in resolved.assets]


def _resource_asset_subset(resolved: ResolvedResources, artifact_ids: set[str]) -> tuple[ResolvedResource, ...]:
    return tuple(resource for resource in resolved.assets if _artifact(resource)["id"] in artifact_ids)


def _resource_javascript(payload: _ResourcePayload, assets: tuple[ResolvedResource, ...]) -> str:
    ''' Render the single portable owner of a resource bundle's executable data. '''
    from ..core.templates import PORTABLE_RESOURCES_JS

    if len(assets) != len(payload["artifacts"]):
        raise RuntimeError("Resource artifact metadata does not match the generated bundle")
    artifacts = [
        {**metadata, "value": _resource_value(resource)}
        for metadata, resource in zip(payload["artifacts"], assets)
    ]
    return PORTABLE_RESOURCES_JS.render(
        resource_id=payload["resource_id"],
        bokeh_version=payload["bokeh_version"],
        requirements=payload["requirements"],
        dependencies=payload["dependencies"],
        load_timeout=payload["load_timeout"],
        artifacts=artifacts,
    )

def _display_payload(artifact: EmbedArtifact, resource_id: str, view_id: str, *,
        live_id: str | None = None, application_id: str | None = None, application_url: str | None = None,
        connect_timeout: int = 10_000) -> _DisplayPayload:
    if (application_id is None) != (application_url is None):
        raise ValueError("application_id and application_url must be provided together")
    payload = _DisplayPayload(
        protocol_version=PROTOCOL_VERSION,
        kind="artifact",
        resource_id=resource_id,
        bokeh_version=_bokehjs_version(__version__),
        python_version=__version__,
        artifact_fingerprint=artifact.fingerprint,
        source_kind=artifact.source["kind"],
        view_id=view_id,
        connect_timeout=connect_timeout,
    )
    if live_id is not None:
        payload["live_id"] = live_id
    if application_id is not None:
        payload["application_id"] = application_id
    if application_url is not None:
        payload["application_url"] = application_url
    return payload

def _file_payload(path: str) -> _FilePayload:
    candidate = PurePosixPath(path)
    windows = PureWindowsPath(path)
    if not path or candidate.is_absolute() or windows.is_absolute() or windows.drive or ".." in candidate.parts or "\\" in path:
        raise ValueError("notebook file links must be safe paths relative to the notebook")
    return _FilePayload(
        protocol_version=PROTOCOL_VERSION,
        kind="file",
        path=path,
    )


def notebook_info() -> _NotebookInfo:
    ''' Return bounded information about the current notebook integration.

    Returns:
        A diagnostic mapping with an HTML representation for notebook display.

    '''
    from .jupyter_app import _APPLICATIONS
    from .notebook import (
        _RESOURCE_RECORDS,
        _anywidget_available,
        _is_marimo_runtime,
        notebook_environment,
    )

    package = Path(__file__).parents[1]
    labextension = package / "jupyter" / "labextension" / "package.json"
    try:
        from IPython import get_ipython

        shell = get_ipython()
        kernel = getattr(shell, "kernel", None)
        comms = kernel is not None and getattr(kernel, "comm_manager", None) is not None
    except Exception:
        comms = False
    return _NotebookInfo(
        bokeh_version=__version__,
        python_version=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        python_executable=sys.executable,
        bokeh_package_path=str(package),
        protocol_version=PROTOCOL_VERSION,
        artifact_mime_type=ARTIFACT_MIME_TYPE,
        display_mime_type=DISPLAY_MIME_TYPE,
        file_mime_type=FILE_MIME_TYPE,
        resources_mime_type=RESOURCES_MIME_TYPE,
        interactive_kernel=notebook_environment(),
        anywidget_available=_anywidget_available(),
        marimo_runtime=_is_marimo_runtime(),
        comm_manager=comms,
        labextension_packaged=labextension.is_file(),
        resource_records=len(_RESOURCE_RECORDS),
        managed_applications=len(_APPLICATIONS),
    )
