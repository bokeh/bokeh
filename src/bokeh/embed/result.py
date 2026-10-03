#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""The versioned, portable embed result contract."""

from __future__ import annotations

# Standard library imports
import hashlib
import json
from copy import deepcopy
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Mapping
from urllib.parse import urlsplit

# Bokeh imports
from .. import __version__
from ._util import canonical_embed_json, escape_json_surrogates
from .resources import ResourceRequirements

if TYPE_CHECKING:
    from pathlib import Path

    from jinja2 import Template

    from ..resources import ResourcesLike
    from .renderers import EmbedFragment, ExternalEmbed

EMBED_SCHEMA = "bokeh.embed/v1"
EMBED_MIME_TYPE = "application/vnd.bokeh.embed+json"


class EmbedValidationError(ValueError):
    """Raised when an embed payload does not satisfy its schema."""


@dataclass(frozen=True)
class EmbedRoot:
    '''Address one embed root without using a DOM or static model ID.

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
            raise EmbedValidationError("embed root keys must not be empty")
        if self.document is not None and (isinstance(self.document, bool) or not isinstance(self.document, int)):
            raise EmbedValidationError("embed root document ordinal must be an integer")
        if self.root is not None and (isinstance(self.root, bool) or not isinstance(self.root, int)):
            raise EmbedValidationError("embed root ordinal must be an integer")
        if self.model_id is not None and (not isinstance(self.model_id, str) or not self.model_id):
            raise EmbedValidationError("embed server root model_id must be a non-empty string")
        structural = self.document is not None or self.root is not None
        if structural and (self.document is None or self.root is None or self.model_id is not None):
            raise EmbedValidationError("a structural root requires document/root ordinals and no model_id")
        if not structural and self.model_id is None:
            raise EmbedValidationError("a server root requires model_id when it is not structural")
        if self.document is not None and (self.document < 0 or self.root is None or self.root < 0):
            raise EmbedValidationError("embed root ordinals must be non-negative")

    def to_dict(self) -> dict[str, Any]:
        '''Return the schema representation of this root address.

        Returns:
            A detached root address mapping.
        '''
        result: dict[str, Any] = {"key": self.key}
        if self.document is not None:
            result.update(document=self.document, root=self.root)
        else:
            result["model_id"] = self.model_id
        return result

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> EmbedRoot:
        '''Validate and reconstruct a root address from schema data.

        Args:
            value: The root address mapping.

        Returns:
            A validated embed root.
        '''
        if not isinstance(value, Mapping):
            raise EmbedValidationError("embed roots must be objects")
        _reject_unknown_fields(value, {"key", "document", "root", "model_id"}, "embed root")
        key = value.get("key")
        if not isinstance(key, str):
            raise EmbedValidationError("embed root keys must be strings")
        return cls(
            key=key,
            document=value.get("document"),
            root=value.get("root"),
            model_id=value.get("model_id"),
        )


@dataclass(frozen=True, init=False)
class EmbedResult:
    '''Immutable, versioned output of the embedding builder.

    ``source`` contains standalone document data or a server descriptor.
    ``roots`` supplies logical addresses. ``requires`` declares runtime assets
    independently from delivery policy. ``fingerprint`` is derived from the
    normalized envelope. Python verifies it when reconstructing a result from
    serialized data.
    '''
    roots: tuple[EmbedRoot, ...]
    requires: ResourceRequirements
    bokeh_version: str
    schema: str
    fingerprint: str
    _source: dict[str, Any] = field(repr=False)
    _metadata: dict[str, Any] = field(repr=False)
    _payload: dict[str, Any] = field(repr=False, compare=False)
    _json_string: str = field(repr=False, compare=False)

    def __init__(self, source: Mapping[str, Any], roots: tuple[EmbedRoot, ...],
            requires: ResourceRequirements | None = None, metadata: Mapping[str, Any] | None = None,
            bokeh_version: str = __version__, schema: str = EMBED_SCHEMA) -> None:
        if not isinstance(source, Mapping):
            raise EmbedValidationError("embed payload source must be an object")
        if metadata is not None and not isinstance(metadata, Mapping):
            raise EmbedValidationError("embed payload metadata must be an object")
        try:
            source_value = dict(source)
            metadata_value = dict(metadata) if metadata is not None else {}
            canonical_embed_json(source_value)
            canonical_embed_json(metadata_value)
            source_data = json.loads(json.dumps(source_value, ensure_ascii=False, allow_nan=False))
            metadata_data = json.loads(json.dumps(
                metadata_value, ensure_ascii=False, allow_nan=False,
            ))
        except (TypeError, ValueError) as error:
            raise EmbedValidationError(str(error)) from error
        object.__setattr__(self, "roots", roots)
        object.__setattr__(self, "requires", requires if requires is not None else ResourceRequirements())
        object.__setattr__(self, "bokeh_version", bokeh_version)
        object.__setattr__(self, "schema", schema)
        object.__setattr__(self, "_source", source_data)
        object.__setattr__(self, "_metadata", metadata_data)
        self._validate()
        envelope = self._envelope()
        try:
            fingerprint = _fingerprint(envelope)
        except (TypeError, ValueError) as error:
            raise EmbedValidationError(str(error)) from error
        payload = {**envelope, "fingerprint": fingerprint}
        object.__setattr__(self, "fingerprint", fingerprint)
        object.__setattr__(self, "_payload", payload)
        object.__setattr__(self, "_json_string", escape_json_surrogates(json.dumps(
            payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False,
        )))

    @property
    def source(self) -> dict[str, Any]:
        '''Return a detached copy of the embed source descriptor.'''
        return deepcopy(self._source)

    @property
    def metadata(self) -> dict[str, Any]:
        '''Return a detached copy of the host metadata.'''
        return deepcopy(self._metadata)

    def _validate(self) -> None:
        if self.schema != EMBED_SCHEMA:
            raise EmbedValidationError(
                f"unsupported embed schema {self.schema!r}; expected {EMBED_SCHEMA!r}",
            )
        if not isinstance(self.bokeh_version, str) or not self.bokeh_version:
            raise EmbedValidationError("embed payload bokeh_version must not be empty")
        if not isinstance(self.requires, ResourceRequirements):
            raise EmbedValidationError("embed payload requires must be a ResourceRequirements instance")
        if not isinstance(self.roots, tuple) or any(not isinstance(root, EmbedRoot) for root in self.roots):
            raise EmbedValidationError("embed payload roots must be EmbedRoot instances")
        kind = self._source.get("kind")
        if kind not in ("standalone", "server"):
            raise EmbedValidationError("embed payload source.kind must be 'standalone' or 'server'")
        if kind == "standalone":
            _reject_unknown_fields(self._source, {"kind", "documents"}, "standalone embed source")
            documents = self._source.get("documents")
            if not isinstance(documents, list) or len(documents) != 1:
                raise EmbedValidationError("standalone embed payloads require exactly one source document")
            if any(not isinstance(document, Mapping) for document in documents):
                raise EmbedValidationError("standalone embed payload documents must be objects")
            for root in self.roots:
                if root.document is None or root.root is None:
                    raise EmbedValidationError("standalone embed roots must use document/root ordinals")
                if root.document >= len(documents):
                    raise EmbedValidationError(f"embed root {root.key!r} refers to missing document {root.document}")
                doc_roots = documents[root.document].get("roots")
                if not isinstance(doc_roots, list) or root.root >= len(doc_roots):
                    raise EmbedValidationError(f"embed root {root.key!r} refers to missing root {root.root}")
        else:
            _reject_unknown_fields(
                self._source,
                {"kind", "url", "session_id", "token", "arguments", "headers", "credentials", "relative_urls"},
                "server embed source",
            )
            url = self._source.get("url")
            if not isinstance(url, str) or not url:
                raise EmbedValidationError("server embed payloads require a non-empty source.url")
            parsed = urlsplit(url)
            if parsed.query or parsed.fragment:
                raise EmbedValidationError("server embed source.url cannot contain a query or fragment")
            if parsed.scheme and (parsed.scheme.lower() not in ("http", "https") or not parsed.netloc):
                raise EmbedValidationError("server embed source.url must be HTTP(S) or relative")
            if not parsed.scheme and parsed.netloc:
                raise EmbedValidationError("server embed source.url cannot be scheme-relative")
            credentials = self._source.get("credentials", "same-origin")
            if credentials not in ("omit", "same-origin", "include"):
                raise EmbedValidationError("server embed credentials must be 'omit', 'same-origin', or 'include'")
            for name in ("arguments", "headers"):
                values = self._source.get(name, {})
                if not isinstance(values, Mapping) or any(
                    not isinstance(key, str) or not isinstance(value, str) for key, value in values.items()
                ):
                    raise EmbedValidationError(f"server embed {name} must map strings to strings")
            for name in ("session_id", "token"):
                value = self._source.get(name)
                if value is not None and (not isinstance(value, str) or not value):
                    raise EmbedValidationError(f"server embed {name} must be a non-empty string")
            relative_urls = self._source.get("relative_urls")
            if relative_urls is not None and not isinstance(relative_urls, bool):
                raise EmbedValidationError("server embed relative_urls must be a boolean")
        keys = [root.key for root in self.roots]
        if len(keys) != len(set(keys)):
            raise EmbedValidationError("embed root keys must be unique")
    def _envelope(self) -> dict[str, Any]:
        return {
            "schema": self.schema,
            "bokeh_version": self.bokeh_version,
            "source": self._source,
            "roots": [root.to_dict() for root in self.roots],
            "requires": self.requires.to_dict(),
            "metadata": self._metadata,
        }

    def to_dict(self) -> dict[str, Any]:
        '''Return a detached JSON-compatible envelope including its fingerprint.

        Returns:
            The complete embed payload.
        '''
        return deepcopy(self._payload)

    def to_json(self) -> dict[str, Any]:
        '''Return the JSON-compatible embed payload.

        Returns:
            The complete embed payload.
        '''
        return self.to_dict()

    def to_json_string(self, *, pretty: bool = False) -> str:
        '''Serialize the embed payload as deterministic JSON.

        Args:
            pretty: Whether to indent the serialized output.

        Returns:
            The serialized embed payload JSON.
        '''
        if pretty:
            return escape_json_surrogates(json.dumps(
                self._payload, ensure_ascii=False, indent=2, allow_nan=False,
            ))
        return self._json_string

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> EmbedResult:
        '''Validate and reconstruct an embed result from payload data.

        Args:
            value: The embed payload.

        Returns:
            A validated embed result.
        '''
        if not isinstance(value, Mapping):
            raise EmbedValidationError("an embed payload must be an object")
        schema = value.get("schema")
        if schema != EMBED_SCHEMA:
            raise EmbedValidationError(
                f"unsupported embed schema {schema!r}; expected {EMBED_SCHEMA!r}",
            )
        if "buffers" in value:
            raise EmbedValidationError(
                "buffers are not part of bokeh.embed/v1; binary server data uses protocol message buffers",
            )
        _reject_unknown_fields(
            value,
            {"schema", "bokeh_version", "source", "roots", "requires", "metadata", "fingerprint"},
            "embed payload",
        )
        supplied = value.get("fingerprint")
        if not isinstance(supplied, str) or not supplied:
            raise EmbedValidationError("embed payload fingerprint must be a non-empty string")
        bokeh_version = value.get("bokeh_version")
        if not isinstance(bokeh_version, str):
            raise EmbedValidationError("embed payload bokeh_version must be a string")
        roots = value.get("roots")
        if not isinstance(roots, list):
            raise EmbedValidationError("embed payload roots must be an array")
        requires = value.get("requires")
        if not isinstance(requires, Mapping):
            raise EmbedValidationError("embed payload requires must be an object")
        try:
            result = cls(
                schema=schema,
                bokeh_version=bokeh_version,
                source=value.get("source", {}),
                roots=tuple(EmbedRoot.from_dict(root) for root in roots),
                requires=ResourceRequirements.from_dict(requires),
                metadata=value.get("metadata", {}),
            )
        except EmbedValidationError:
            raise
        except (KeyError, TypeError, ValueError) as error:
            raise EmbedValidationError(f"invalid embed payload: {error}") from error
        if supplied != result.fingerprint:
            raise EmbedValidationError(
                f"embed payload fingerprint mismatch: expected {result.fingerprint!r}, received {supplied!r}",
            )
        return result

    @classmethod
    def from_json(cls, value: str) -> EmbedResult:
        '''Parse and validate an embed payload JSON object.

        Args:
            value: The serialized embed payload JSON.

        Returns:
            A validated embed result.
        '''
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError as error:
            raise EmbedValidationError(f"invalid embed payload JSON: {error}") from error
        if not isinstance(parsed, dict):
            raise EmbedValidationError("an embed payload must be a JSON object")
        return cls.from_dict(parsed)

    def fragment(self, resources: ResourcesLike | None = "none", *,
            bootstrap_url: str | None = None) -> EmbedFragment:
        '''Render composable targets, bootstrap code, and resolved resources.

        Args:
            resources: The resource delivery policy.
            bootstrap_url: An optional external bootstrap script URL.

        Returns:
            A composable embed fragment.
        '''
        from .renderers import render_fragment
        return render_fragment(self, resources=resources, bootstrap_url=bootstrap_url)

    def page(self, resources: ResourcesLike | None = None, *, title: str | None = None,
            template: Template | str | Path | None = None, template_variables: Mapping[str, Any] | None = None,
            bootstrap_url: str | None = None) -> str:
        '''Render a complete HTML page from this embed result.

        Args:
            resources: The resource delivery policy.
            title: An optional document title.
            template: An optional page template.
            template_variables: Variables supplied to the page template.
            bootstrap_url: An optional external bootstrap script URL.

        Returns:
            The rendered HTML page.
        '''
        from .renderers import render_page
        return render_page(
            self, resources=resources, title=title, template=template,
            template_variables=template_variables, bootstrap_url=bootstrap_url,
        )

    def external(self, payload_url: str, resources: ResourcesLike | None = "none",
            *, bootstrap_url: str | None = None) -> ExternalEmbed:
        '''Render targets that fetch this embed payload from a URL.

        Args:
            payload_url: The URL from which the host will fetch the embed payload.
            resources: The resource delivery policy.
            bootstrap_url: An optional external bootstrap script URL.

        Returns:
            A declaration for an externally stored embed payload.
        '''
        from .renderers import render_external
        return render_external(
            self, payload_url=payload_url, resources=resources, bootstrap_url=bootstrap_url,
        )

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
    payload = canonical_embed_json(normalized)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _reject_unknown_fields(value: Mapping[str, Any], allowed: set[str], context: str) -> None:
    unknown = sorted(set(value) - allowed)
    if unknown:
        raise EmbedValidationError(f"{context} contains unknown fields: {unknown!r}")


def _normalize_model_ids(value: Any) -> Any:
    ids: list[str] = []
    seen: set[str] = set()

    def collect(child: Any) -> None:
        if isinstance(child, dict):
            compact = isinstance(child.get("$type"), str)
            model_id = child.get("$id" if compact else "id")
            if (compact or child.get("type") == "object") and isinstance(model_id, str) and model_id not in seen:
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
                key: replacements.get(item, item) if key in ("id", "$id", "$ref") and isinstance(item, str) else replace(item)
                for key, item in child.items()
            }
        if isinstance(child, (list, tuple)):
            return [replace(item) for item in child]
        return child

    return replace(value)


__all__ = (
    "EmbedRoot",
    "EmbedValidationError",
    "EMBED_MIME_TYPE",
    "EMBED_SCHEMA",
    "EmbedResult",
)
