#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Resource requirements and delivery policies for embedding artifacts."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, Mapping, Sequence, cast
from urllib.parse import urlparse

from .. import __version__
from ..core.has_props import HasProps
from ..document import Document
from ..resources import Component, Resources
from ..util.compiler import bundle_models
from .bundle import _all_objs, _use_gl, _use_mathjax, _use_tables, _use_widgets
from .bundle import _bundle_extensions as legacy_bundle_extensions

type ResourceComponent = Literal[
    "bokeh/core",
    "bokeh/widgets",
    "bokeh/tables",
    "bokeh/webgl",
    "bokeh/mathjax",
    "bokeh/api",
]

type ResourcePolicyMode = Literal[
    "none",
    "inline",
    "offline",
    "cdn",
    "server",
    "relative",
    "absolute",
]

_RESOURCE_POLICY_MODES = ("none", "inline", "offline", "cdn", "server", "relative", "absolute")


class ResourceConflictError(ValueError):
    """Raised when a resource policy cannot satisfy artifact requirements."""


@dataclass(frozen=True)
class ResourceAssetRequirement:
    kind: Literal["script", "style"]
    url: str | None = None
    content: str | None = None
    integrity: str | None = None
    crossorigin: str | None = None
    module: bool = False

    def __post_init__(self) -> None:
        if (self.url is None) == (self.content is None):
            raise ValueError("a resource asset requirement needs exactly one of 'url' or 'content'")

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {"kind": self.kind}
        for name in ("url", "content", "integrity", "crossorigin"):
            value = getattr(self, name)
            if value is not None:
                result[name] = value
        if self.module:
            result["module"] = True
        return result

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> ResourceAssetRequirement:
        return cls(
            kind=value["kind"],
            url=value.get("url"),
            content=value.get("content"),
            integrity=value.get("integrity"),
            crossorigin=value.get("crossorigin"),
            module=bool(value.get("module", False)),
        )


@dataclass(frozen=True)
class ExtensionRequirement:
    name: str
    assets: tuple[ResourceAssetRequirement, ...] = ()

    def to_dict(self) -> dict[str, Any]:
        return {"name": self.name, "assets": [asset.to_dict() for asset in self.assets]}

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> ExtensionRequirement:
        return cls(
            name=str(value["name"]),
            assets=tuple(ResourceAssetRequirement.from_dict(asset) for asset in value.get("assets", [])),
        )


@dataclass(frozen=True)
class ResourceRequirements:
    components: tuple[ResourceComponent, ...] = ("bokeh/core",)
    extensions: tuple[ExtensionRequirement, ...] = ()

    def __post_init__(self) -> None:
        unknown = [component for component in self.components if component not in _COMPONENT_NAMES]
        if unknown:
            raise ValueError(f"unknown Bokeh resource components: {unknown!r}")
        if len(self.components) != len(set(self.components)):
            raise ValueError("Bokeh resource components must be unique")
        names = [extension.name for extension in self.extensions]
        if len(names) != len(set(names)):
            raise ValueError("Bokeh extension requirements must have unique names")

    def to_dict(self) -> dict[str, Any]:
        return {
            "components": list(self.components),
            "extensions": [extension.to_dict() for extension in self.extensions],
        }

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> ResourceRequirements:
        return cls(
            components=tuple(value.get("components", ("bokeh/core",))),
            extensions=tuple(ExtensionRequirement.from_dict(extension) for extension in value.get("extensions", [])),
        )

    @classmethod
    def dynamic_server(cls) -> ResourceRequirements:
        return cls(("bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/webgl", "bokeh/mathjax", "bokeh/api"))


@dataclass(frozen=True)
class ResolvedResource:
    kind: Literal["script", "style"]
    url: str | None = None
    content: str | None = None
    integrity: str | None = None
    crossorigin: str | None = None
    nonce: str | None = None
    module: bool = False

    @property
    def identity(self) -> tuple[Any, ...]:
        return (self.kind, self.url, self.content, self.integrity, self.crossorigin, self.module)

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {"kind": self.kind}
        for name in ("url", "content", "integrity", "crossorigin", "nonce"):
            value = getattr(self, name)
            if value is not None:
                result[name] = value
        if self.module:
            result["module"] = True
        return result


@dataclass(frozen=True)
class ResolvedResources:
    requirements: ResourceRequirements
    policy: ResourcePolicy
    assets: tuple[ResolvedResource, ...] = ()

    def to_dict(self) -> dict[str, Any]:
        return {
            "policy": self.policy.to_dict(),
            "assets": [asset.to_dict() for asset in self.assets],
        }

    @property
    def fingerprint(self) -> str:
        policy = self.policy.to_dict()
        policy.pop("base_dir", None)
        policy.pop("root_dir", None)
        payload = {
            "requirements": self.requirements.to_dict(),
            "policy": policy,
            "assets": [asset.to_dict() for asset in self.assets],
        }
        encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class ResourcePolicy:
    mode: ResourcePolicyMode = "cdn"
    version: str = __version__.split("+")[0]
    minified: bool = True
    root_url: str | None = None
    root_dir: Path | None = None
    base_dir: Path | None = None
    nonce: str | None = None
    crossorigin: str | None = None
    integrity: bool = False
    external_only: bool = False
    retry: bool = False

    def __post_init__(self) -> None:
        if self.mode not in _RESOURCE_POLICY_MODES:
            raise ResourceConflictError(
                f"unknown resource policy {self.mode!r}; expected one of {_RESOURCE_POLICY_MODES!r}",
            )
        if not self.version:
            raise ResourceConflictError("resource policy version must not be empty")
        if self.mode in ("inline", "offline") and self.external_only:
            raise ResourceConflictError(
                f"resource policy '{self.mode}' emits inline assets and conflicts with external_only=True",
            )
        if self.integrity and self.mode != "cdn":
            raise ResourceConflictError("subresource integrity is only available for CDN resource policy")
        if self.root_url is not None and self.mode != "server":
            raise ResourceConflictError("root_url is only valid for the server resource policy")
        if self.root_dir is not None and self.mode != "relative":
            raise ResourceConflictError("root_dir is only valid for the relative resource policy")

    @classmethod
    def build(cls, value: ResourcePolicy | Resources | str | None = None, **overrides: Any) -> ResourcePolicy:
        if isinstance(value, ResourcePolicy):
            if not overrides:
                return value
            data = value.to_dict()
            data.update(overrides)
            return cls(**data)
        if isinstance(value, Resources):
            data: dict[str, Any] = {
                "mode": value.mode,
                "version": value.version or __version__,
                "minified": value.minified,
                "base_dir": value.base_dir,
            }
            if value.mode == "server":
                data["root_url"] = value.root_url
            elif value.mode == "relative":
                data["root_dir"] = value.root_dir
            data.update(overrides)
            return cls(**data)
        mode = cast(ResourcePolicyMode, "cdn" if value is None else value)
        return cls(mode=mode, **overrides)

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "mode": self.mode,
            "version": self.version,
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
        for name in ("integrity", "external_only", "retry"):
            value = getattr(self, name)
            if value:
                result[name] = value
        return result

    def resolve(self, requirements: ResourceRequirements) -> ResolvedResources:
        if self.mode == "none":
            return ResolvedResources(requirements, self)

        component_names: list[Component] = [_COMPONENT_NAMES[component] for component in requirements.components]
        resources_mode = "inline" if self.mode == "offline" else self.mode
        resources = Resources(
            mode=resources_mode,
            version=self.version if resources_mode == "cdn" else None,
            root_dir=self.root_dir if resources_mode == "relative" else None,
            root_url=self.root_url if resources_mode == "server" else None,
            minified=self.minified,
            components=component_names,
            base_dir=self.base_dir,
        )

        js_files, js_raw, hashes = resources._resolve("js")
        css_files, css_raw, _ = resources._resolve("css")
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
        assets.extend(ResolvedResource("style", url=url, crossorigin=self.crossorigin, nonce=self.nonce) for url in css_files)
        assets.extend(ResolvedResource("style", content=content, nonce=self.nonce) for content in css_raw)

        for extension in requirements.extensions:
            for requirement in extension.assets:
                if self.mode == "offline" and requirement.url is not None:
                    raise ResourceConflictError(
                        f"offline policy cannot load external {requirement.kind} {requirement.url!r} "
                        f"required by extension {extension.name!r}; provide inline extension content",
                    )
                if self.mode == "inline" and requirement.url is not None:
                    raise ResourceConflictError(
                        f"inline policy cannot inline {requirement.url!r} required by extension {extension.name!r}; "
                        "declare the extension asset content or choose an external policy",
                    )
                if self.external_only and requirement.content is not None:
                    raise ResourceConflictError(
                        f"external_only policy rejects inline {requirement.kind} required by extension {extension.name!r}",
                    )
                assets.append(ResolvedResource(
                    requirement.kind,
                    url=requirement.url,
                    content=requirement.content,
                    integrity=requirement.integrity,
                    crossorigin=requirement.crossorigin or self.crossorigin,
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

        return ResolvedResources(requirements, self, tuple(deduplicated))


_COMPONENT_NAMES: dict[ResourceComponent, Component] = {
    "bokeh/core": "bokeh",
    "bokeh/widgets": "bokeh-widgets",
    "bokeh/tables": "bokeh-tables",
    "bokeh/webgl": "bokeh-gl",
    "bokeh/mathjax": "bokeh-mathjax",
    "bokeh/api": "bokeh-api",
}


def requirements_for_objs(objs: Sequence[HasProps | Document]) -> ResourceRequirements:
    all_objs = _all_objs(objs)
    components: list[ResourceComponent] = ["bokeh/core"]
    if _use_widgets(all_objs):
        components.append("bokeh/widgets")
    if _use_tables(all_objs):
        components.append("bokeh/tables")
    if _use_gl(all_objs):
        components.append("bokeh/webgl")
    if _use_mathjax(all_objs):
        components.append("bokeh/mathjax")
    components.append("bokeh/api")

    extensions: dict[str, list[ResourceAssetRequirement]] = {}
    seen_assets: set[tuple[Any, ...]] = set()
    for obj in sorted(all_objs, key=lambda value: (
        value.__class__.__module__, value.__class__.__name__, getattr(value, "id", ""),
    )):
        cls = obj.__class__
        module = cls.__view_module__.split(".", 1)[0]
        extension_name = module if module != "bokeh" else f"{cls.__module__}.{cls.__name__}"
        assets = extensions.setdefault(extension_name, [])
        resource_attributes: tuple[tuple[str, Literal["script", "style"]], ...] = (
            ("__javascript__", "script"), ("__css__", "style"),
        )
        for attr, kind in resource_attributes:
            external = getattr(cls, attr, None)
            values = [external] if isinstance(external, str) else list(external or [])
            for url in values:
                key = (kind, url)
                if key not in seen_assets:
                    seen_assets.add(key)
                    assets.append(ResourceAssetRequirement(kind, url=url))
        if not assets and module == "bokeh":
            extensions.pop(extension_name, None)

    package_resources = Resources(mode="inline", components=[])
    for package in legacy_bundle_extensions(all_objs, package_resources):
        name = f"package:{package.artifact_path.stem}"
        assets = extensions.setdefault(name, [])
        assets.append(ResourceAssetRequirement("script", content=Resources._inline(package.artifact_path)))

    custom_classes = sorted(
        {obj.__class__ for obj in all_objs if hasattr(obj, "__implementation__")},
        key=lambda cls: (cls.__module__, cls.__name__),
    )
    custom_bundle = bundle_models(custom_classes) if custom_classes else None
    if custom_bundle is not None:
        extensions.setdefault("bokeh.custom-models", []).append(
            ResourceAssetRequirement("script", content=custom_bundle),
        )

    return ResourceRequirements(
        tuple(components),
        tuple(ExtensionRequirement(name, tuple(assets)) for name, assets in sorted(extensions.items())),
    )


def _integrity_for_url(url: str, hashes: Mapping[str, str]) -> str | None:
    filename = Path(urlparse(url).path).name
    value = hashes.get(url) or hashes.get(filename)
    return None if value is None else f"sha384-{value}"


__all__ = (
    "ExtensionRequirement",
    "ResolvedResource",
    "ResolvedResources",
    "ResourceAssetRequirement",
    "ResourceConflictError",
    "ResourcePolicy",
    "ResourceRequirements",
    "requirements_for_objs",
)
