#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Compile Python embedding intent into a versioned :class:`EmbedArtifact`."""

from __future__ import annotations

# Standard library imports
import logging
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Literal

# Bokeh imports
from ..document import Document
from ..model import Model
from ..resources import DEFAULT_SERVER_HTTP_URL
from .artifact import ArtifactRoot, EmbedArtifact
from .resources import ResourceRequirements, requirements_for_objs
from .util import OutputDocumentFor, ThemeSource, submodel_has_python_callbacks

log = logging.getLogger(__name__)

type CallbackPolicy = Literal["warn", "error", "suppress"]
type EmbedInput = Model | Document | Sequence[Model | Document] | Mapping[str, Model | Document]
type ServerRoot = Model | str


class EmbedCompileError(ValueError):
    """Raised when Python embedding intent cannot be compiled."""


@dataclass(frozen=True)
class EmbedSpec:
    '''Normalized standalone compiler input.

    ``models`` and ``keys`` are parallel ordered tuples. ``input_shape`` records
    the caller-facing form for diagnostics and metadata; the remaining fields
    control theme application, callback validation, metadata, and temporary
    document reuse. Hosts should normally call :func:`embed` rather than build
    a specification directly.
    '''
    models: tuple[Model, ...]
    keys: tuple[str, ...]
    input_shape: Literal["single", "sequence", "mapping", "document"]
    theme: ThemeSource = None
    callback_policy: CallbackPolicy = "warn"
    metadata: Mapping[str, Any] | None = None
    always_new: bool = False


def embed(models: EmbedInput, *, theme: ThemeSource = None, callback_policy: CallbackPolicy = "warn",
        metadata: Mapping[str, Any] | None = None, _always_new: bool = False) -> EmbedArtifact:
    """Compile standalone Bokeh content into one portable embedding artifact.

    Mapping keys become stable logical root keys. Sequences receive ordinal
    keys, and a single model receives ``"root"``. The compiler records exact
    resource requirements but does not choose how a host delivers them.
    """
    spec = _standalone_spec(
        models, theme=theme, callback_policy=callback_policy, metadata=metadata, always_new=_always_new,
    )
    return compile_embed(spec)


def compile_embed(spec: EmbedSpec) -> EmbedArtifact:
    '''Compile an already-normalized specification into an immutable artifact.'''
    if spec.callback_policy not in ("warn", "error", "suppress"):
        raise EmbedCompileError("callback_policy must be 'warn', 'error', or 'suppress'")

    if submodel_has_python_callbacks(spec.models):
        message = (
            "standalone embedding cannot execute Python callbacks; use CustomJS or a Bokeh server source"
        )
        if spec.callback_policy == "error":
            raise EmbedCompileError(message)
        if spec.callback_policy == "warn":
            log.warning(message)

    with OutputDocumentFor(spec.models, apply_theme=spec.theme, always_new=spec.always_new) as document:
        positions = {model: index for index, model in enumerate(document.roots)}
        try:
            roots = tuple(ArtifactRoot(key, document=0, root=positions[model]) for key, model in zip(spec.keys, spec.models))
        except KeyError as error:
            raise EmbedCompileError("an embedding root is not a root of the compiler document") from error
        document_json = document.to_static_json(deferred=False)
        requirements = requirements_for_objs([document])

    artifact_metadata = dict(spec.metadata or {})
    artifact_metadata["compiler"] = {
        "callback_policy": spec.callback_policy,
        "input_shape": spec.input_shape,
        "static_model_ids": "graph-minimal",
    }
    return EmbedArtifact(
        source={"kind": "standalone", "documents": [document_json]},
        roots=roots,
        requires=requirements,
        metadata=artifact_metadata,
    )


def embed_server(url: str = "default", *, session_id: str | None = None,
        roots: Mapping[str, ServerRoot] | None = None, arguments: Mapping[str, str] | None = None,
        headers: Mapping[str, str] | None = None, with_credentials: bool = False,
        relative_urls: bool = False, metadata: Mapping[str, Any] | None = None,
        token: str | None = None) -> EmbedArtifact:
    """Create a server-source artifact for a new or existing Bokeh session.

    A token-bearing artifact is normally produced by the Bokeh server bootstrap
    endpoint. ``token`` is exposed for direct server page construction, where a
    trusted ``ServerSession`` already owns the signed token.
    """
    if headers and with_credentials:
        raise EmbedCompileError("'headers' and 'with_credentials' are mutually exclusive")
    if url == "default":
        url = DEFAULT_SERVER_HTTP_URL
    if url.startswith("ws"):
        raise EmbedCompileError("url must be an HTTP(S) Bokeh application URL, not a WebSocket URL")
    url = url.rstrip("/")
    if not url:
        raise EmbedCompileError("a Bokeh server application URL is required")

    artifact_roots: list[ArtifactRoot] = []
    for key, value in (roots or {}).items():
        model_id = value.id if isinstance(value, Model) else value
        if not isinstance(key, str) or not key:
            raise EmbedCompileError("server root keys must be non-empty strings")
        if not isinstance(model_id, str) or not model_id:
            raise EmbedCompileError(f"server root {key!r} must identify a model by a non-empty ID")
        artifact_roots.append(ArtifactRoot(key, model_id=model_id))

    source: dict[str, Any] = {
        "kind": "server",
        "url": url,
        "arguments": dict(sorted((arguments or {}).items())),
        "headers": dict(sorted((headers or {}).items())),
        "credentials": "include" if with_credentials else "same-origin",
        "relative_urls": relative_urls,
    }
    if session_id is not None:
        source["session_id"] = session_id
    if token is not None:
        source["token"] = token

    artifact_metadata = dict(metadata or {})
    artifact_metadata["compiler"] = {
        "source": "server",
        "resource_requirements": "dynamic-conservative",
    }
    return EmbedArtifact(
        source=source,
        roots=tuple(artifact_roots),
        requires=ResourceRequirements.dynamic_server(),
        metadata=artifact_metadata,
    )


def _standalone_spec(models: EmbedInput, *, theme: ThemeSource, callback_policy: CallbackPolicy,
        metadata: Mapping[str, Any] | None, always_new: bool) -> EmbedSpec:
    roots: list[Model] = []
    keys: list[str] = []

    def add(value: Model | Document, base_key: str) -> None:
        if isinstance(value, Model):
            roots.append(value)
            keys.append(base_key)
        elif isinstance(value, Document):
            if not value.roots:
                raise EmbedCompileError("cannot embed a Document with no root models")
            for index, root in enumerate(value.roots):
                roots.append(root)
                keys.append(base_key if len(value.roots) == 1 else f"{base_key}:{index}")
        else:
            raise EmbedCompileError(f"expected a Bokeh Model or Document, received {type(value).__name__}")

    if isinstance(models, Model):
        add(models, "root")
        input_shape: Literal["single", "sequence", "mapping", "document"] = "single"
    elif isinstance(models, Document):
        for index, root in enumerate(models.roots):
            roots.append(root)
            keys.append("root" if len(models.roots) == 1 else f"root-{index}")
        if not roots:
            raise EmbedCompileError("cannot embed a Document with no root models")
        input_shape = "document"
    elif isinstance(models, Mapping):
        for key, value in models.items():
            if not isinstance(key, str) or not key:
                raise EmbedCompileError("embedding mapping keys must be non-empty strings")
            add(value, key)
        input_shape = "mapping"
    elif isinstance(models, Sequence) and not isinstance(models, (str, bytes)):
        for index, value in enumerate(models):
            add(value, f"root-{index}")
        input_shape = "sequence"
    else:
        raise EmbedCompileError(
            "embed() expects a Model, Document, sequence, or string-keyed mapping of Models/Documents",
        )

    if not roots:
        raise EmbedCompileError("embed() requires at least one root model")
    if len(set(roots)) != len(roots):
        raise EmbedCompileError("the same Bokeh model cannot be assigned to more than one logical artifact root")
    if len(set(keys)) != len(keys):
        raise EmbedCompileError("logical artifact root keys must be unique")
    return EmbedSpec(tuple(roots), tuple(keys), input_shape, theme, callback_policy, metadata, always_new)


__all__ = (
    "CallbackPolicy",
    "EmbedCompileError",
    "EmbedSpec",
    "compile_embed",
    "embed",
    "embed_server",
)
