#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""The versioned, portable embedding artifact contract."""

from __future__ import annotations

# Standard library imports
import hashlib
import json
from copy import deepcopy
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Mapping

# Bokeh imports
from .. import __version__
from ._json import canonical_json, json_copy
from .resources import ResourceRequirements

if TYPE_CHECKING:
    from pathlib import Path

    from jinja2 import Template

    from ..resources import Resources
    from .renderers import ArtifactFragment, ExternalArtifact
    from .resources import ResourcePolicy

EMBED_ARTIFACT_SCHEMA = "bokeh.embed/v1"
EMBED_ARTIFACT_MIME_TYPE = "application/vnd.bokeh.embed+json"


class ArtifactValidationError(ValueError):
    """Raised when an embedding artifact does not satisfy its schema."""


@dataclass(frozen=True)
class ArtifactRoot:
    '''Address one artifact root without using a DOM or static model ID.

    Standalone roots use ``document`` and ``root`` ordinals. Server roots use
    ``model_id`` because the live protocol requires an existing identity.
    ``key`` is the stable name exposed to hosts and mount handles.
    '''
    key: str
    document: int | None = None
    root: int | None = None
    model_id: str | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.key, str) or not self.key:
            raise ArtifactValidationError("artifact root keys must not be empty")
        if self.document is not None and (isinstance(self.document, bool) or not isinstance(self.document, int)):
            raise ArtifactValidationError("artifact root document ordinal must be an integer")
        if self.root is not None and (isinstance(self.root, bool) or not isinstance(self.root, int)):
            raise ArtifactValidationError("artifact root ordinal must be an integer")
        if self.model_id is not None and (not isinstance(self.model_id, str) or not self.model_id):
            raise ArtifactValidationError("artifact server root model_id must be a non-empty string")
        structural = self.document is not None or self.root is not None
        if structural and (self.document is None or self.root is None or self.model_id is not None):
            raise ArtifactValidationError("a structural root requires document/root ordinals and no model_id")
        if not structural and self.model_id is None:
            raise ArtifactValidationError("a server root requires model_id when it is not structural")
        if self.document is not None and (self.document < 0 or self.root is None or self.root < 0):
            raise ArtifactValidationError("artifact root ordinals must be non-negative")

    def to_dict(self) -> dict[str, Any]:
        '''Return the schema representation of this root address.'''
        result: dict[str, Any] = {"key": self.key}
        if self.document is not None:
            result.update(document=self.document, root=self.root)
        else:
            result["model_id"] = self.model_id
        return result

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> ArtifactRoot:
        '''Validate and reconstruct a root address from schema data.'''
        if not isinstance(value, Mapping):
            raise ArtifactValidationError("artifact roots must be objects")
        key = value.get("key")
        if not isinstance(key, str):
            raise ArtifactValidationError("artifact root keys must be strings")
        return cls(
            key=key,
            document=value.get("document"),
            root=value.get("root"),
            model_id=value.get("model_id"),
        )


@dataclass(frozen=True)
class EmbedArtifact:
    '''Immutable, versioned output of the embedding compiler.

    ``source`` contains standalone document data or a server descriptor;
    ``roots`` supplies logical addresses; ``requires`` declares runtime assets
    independently from delivery policy. ``fingerprint`` is derived from the
    normalized envelope and is verified whenever serialized data is read.
    '''
    source: Mapping[str, Any]
    roots: tuple[ArtifactRoot, ...]
    requires: ResourceRequirements = field(default_factory=ResourceRequirements)
    metadata: Mapping[str, Any] = field(default_factory=dict)
    bokeh_version: str = __version__
    schema: str = EMBED_ARTIFACT_SCHEMA
    fingerprint: str = field(init=False)

    def __post_init__(self) -> None:
        if self.schema != EMBED_ARTIFACT_SCHEMA:
            raise ArtifactValidationError(
                f"unsupported embedding artifact schema {self.schema!r}; expected {EMBED_ARTIFACT_SCHEMA!r}",
            )
        if not isinstance(self.bokeh_version, str) or not self.bokeh_version:
            raise ArtifactValidationError("artifact bokeh_version must not be empty")
        if not isinstance(self.source, Mapping):
            raise ArtifactValidationError("artifact source must be an object")
        if not isinstance(self.metadata, Mapping):
            raise ArtifactValidationError("artifact metadata must be an object")
        if not isinstance(self.requires, ResourceRequirements):
            raise ArtifactValidationError("artifact requires must be a ResourceRequirements instance")
        if not isinstance(self.roots, tuple) or any(not isinstance(root, ArtifactRoot) for root in self.roots):
            raise ArtifactValidationError("artifact roots must be ArtifactRoot instances")
        kind = self.source.get("kind")
        if kind not in ("standalone", "server"):
            raise ArtifactValidationError("artifact source.kind must be 'standalone' or 'server'")
        if kind == "standalone":
            documents = self.source.get("documents")
            if not isinstance(documents, list) or len(documents) != 1:
                raise ArtifactValidationError("standalone artifacts require exactly one source document")
            if any(not isinstance(document, Mapping) for document in documents):
                raise ArtifactValidationError("standalone artifact documents must be objects")
            for root in self.roots:
                if root.document is None or root.root is None:
                    raise ArtifactValidationError("standalone artifact roots must use document/root ordinals")
                if root.document >= len(documents):
                    raise ArtifactValidationError(f"artifact root {root.key!r} refers to missing document {root.document}")
                doc_roots = documents[root.document].get("roots")
                if not isinstance(doc_roots, list) or root.root >= len(doc_roots):
                    raise ArtifactValidationError(f"artifact root {root.key!r} refers to missing root {root.root}")
        else:
            url = self.source.get("url")
            if not isinstance(url, str) or not url:
                raise ArtifactValidationError("server artifacts require a non-empty source.url")
            credentials = self.source.get("credentials", "same-origin")
            if credentials not in ("omit", "same-origin", "include"):
                raise ArtifactValidationError("server artifact credentials must be 'omit', 'same-origin', or 'include'")
            for name in ("arguments", "headers"):
                values = self.source.get(name, {})
                if not isinstance(values, Mapping) or any(
                    not isinstance(key, str) or not isinstance(value, str) for key, value in values.items()
                ):
                    raise ArtifactValidationError(f"server artifact {name} must map strings to strings")
            for name in ("session_id", "token"):
                value = self.source.get(name)
                if value is not None and (not isinstance(value, str) or not value):
                    raise ArtifactValidationError(f"server artifact {name} must be a non-empty string")
            relative_urls = self.source.get("relative_urls")
            if relative_urls is not None and not isinstance(relative_urls, bool):
                raise ArtifactValidationError("server artifact relative_urls must be a boolean")
        keys = [root.key for root in self.roots]
        if len(keys) != len(set(keys)):
            raise ArtifactValidationError("artifact root keys must be unique")
        try:
            object.__setattr__(self, "source", json_copy(dict(self.source)))
            object.__setattr__(self, "metadata", json_copy(dict(self.metadata)))
        except ValueError as error:
            raise ArtifactValidationError(str(error)) from error
        object.__setattr__(self, "fingerprint", _fingerprint(self._data(include_fingerprint=False)))

    def _data(self, *, include_fingerprint: bool) -> dict[str, Any]:
        result: dict[str, Any] = {
            "schema": self.schema,
            "bokeh_version": self.bokeh_version,
            "source": deepcopy(dict(self.source)),
            "roots": [root.to_dict() for root in self.roots],
            "requires": self.requires.to_dict(),
            "metadata": deepcopy(dict(self.metadata)),
        }
        if include_fingerprint:
            result["fingerprint"] = self.fingerprint
        return result

    def to_dict(self) -> dict[str, Any]:
        '''Return a detached JSON-compatible envelope including its fingerprint.'''
        return self._data(include_fingerprint=True)

    def to_json(self) -> dict[str, Any]:
        """Return the JSON-compatible artifact envelope."""
        return self.to_dict()

    def to_json_string(self, *, pretty: bool = False) -> str:
        '''Serialize the artifact deterministically as compact or indented JSON.'''
        if pretty:
            return json.dumps(self.to_dict(), ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False)
        return canonical_json(self.to_dict())

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> EmbedArtifact:
        '''Validate schema, versioned fields, roots, and fingerprint.'''
        if not isinstance(value, Mapping):
            raise ArtifactValidationError("an embedding artifact must be an object")
        schema = value.get("schema")
        if schema != EMBED_ARTIFACT_SCHEMA:
            raise ArtifactValidationError(
                f"unsupported embedding artifact schema {schema!r}; expected {EMBED_ARTIFACT_SCHEMA!r}",
            )
        if "buffers" in value:
            raise ArtifactValidationError(
                "artifact buffers are not part of bokeh.embed/v1; binary server data uses protocol message buffers",
            )
        supplied = value.get("fingerprint")
        if not isinstance(supplied, str) or not supplied:
            raise ArtifactValidationError("artifact fingerprint must be a non-empty string")
        bokeh_version = value.get("bokeh_version")
        if not isinstance(bokeh_version, str):
            raise ArtifactValidationError("artifact bokeh_version must be a string")
        roots = value.get("roots")
        if not isinstance(roots, list):
            raise ArtifactValidationError("artifact roots must be an array")
        requires = value.get("requires")
        if not isinstance(requires, Mapping):
            raise ArtifactValidationError("artifact requires must be an object")
        try:
            artifact = cls(
                schema=schema,
                bokeh_version=bokeh_version,
                source=value.get("source", {}),
                roots=tuple(ArtifactRoot.from_dict(root) for root in roots),
                requires=ResourceRequirements.from_dict(requires),
                metadata=value.get("metadata", {}),
            )
        except ArtifactValidationError:
            raise
        except (KeyError, TypeError, ValueError) as error:
            raise ArtifactValidationError(f"invalid embedding artifact: {error}") from error
        if supplied != artifact.fingerprint:
            raise ArtifactValidationError(
                f"artifact fingerprint mismatch: expected {artifact.fingerprint!r}, received {supplied!r}",
            )
        return artifact

    @classmethod
    def from_json(cls, value: str) -> EmbedArtifact:
        '''Parse and validate an artifact JSON object.'''
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError as error:
            raise ArtifactValidationError(f"invalid embedding artifact JSON: {error}") from error
        if not isinstance(parsed, dict):
            raise ArtifactValidationError("an embedding artifact must be a JSON object")
        return cls.from_dict(parsed)

    def fragment(self, resources: ResourcePolicy | Resources | str | None = "none", **kwargs: Any) -> ArtifactFragment:
        '''Render composable targets, bootstrap code, and resolved resources.'''
        from .renderers import render_fragment
        return render_fragment(self, resources=resources, **kwargs)

    def page(self, resources: ResourcePolicy | Resources | str | None = None, *, title: str | None = None,
            template: Template | str | Path | None = None, template_variables: Mapping[str, Any] | None = None,
            **kwargs: Any) -> str:
        '''Render a complete HTML page from this artifact.'''
        from .renderers import render_page
        return render_page(
            self, resources=resources, title=title, template=template,
            template_variables=template_variables, **kwargs,
        )

    def external(self, payload_url: str, resources: ResourcePolicy | Resources | str | None = "none",
            **kwargs: Any) -> ExternalArtifact:
        '''Render targets that fetch this artifact from ``payload_url``.'''
        from .renderers import render_external
        return render_external(self, payload_url=payload_url, resources=resources, **kwargs)

    def _repr_mimebundle_(self, include: Any = None, exclude: Any = None) -> dict[str, Any]:
        from .renderers import render_mimebundle
        return render_mimebundle(self)


def _fingerprint(value: Mapping[str, Any]) -> str:
    normalized = dict(value)
    source = normalized.get("source")
    if isinstance(source, Mapping) and source.get("kind") == "standalone":
        documents = source.get("documents")
        if isinstance(documents, list):
            normalized["source"] = {
                **source,
                "documents": [_normalize_model_ids(document) for document in documents],
            }
    payload = canonical_json(normalized)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _normalize_model_ids(value: Any) -> Any:
    ids: list[str] = []
    seen: set[str] = set()

    def collect(child: Any) -> None:
        if isinstance(child, dict):
            model_id = child.get("id")
            if child.get("type") == "object" and isinstance(model_id, str) and model_id not in seen:
                seen.add(model_id)
                ids.append(model_id)
            for key in sorted(child):
                collect(child[key])
        elif isinstance(child, (list, tuple)):
            for item in child:
                collect(item)

    collect(value)
    replacements = {model_id: f"model-{index}" for index, model_id in enumerate(ids)}

    def replace(child: Any) -> Any:
        if isinstance(child, dict):
            return {
                key: replacements.get(item, item) if key == "id" and isinstance(item, str) else replace(item)
                for key, item in child.items()
            }
        if isinstance(child, (list, tuple)):
            return [replace(item) for item in child]
        return child

    return replace(value)


__all__ = (
    "ArtifactRoot",
    "ArtifactValidationError",
    "EMBED_ARTIFACT_MIME_TYPE",
    "EMBED_ARTIFACT_SCHEMA",
    "EmbedArtifact",
)
