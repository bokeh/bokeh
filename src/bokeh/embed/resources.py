#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Resource requirements and delivery policies for embedding artifacts."""

from __future__ import annotations

# Standard library imports
import hashlib
import json
import os
from dataclasses import dataclass
from os.path import normpath
from pathlib import Path
from typing import (
    Any,
    Callable,
    Literal,
    Mapping,
    NotRequired,
    Sequence,
    TypedDict,
    cast,
)
from urllib.parse import urljoin

# Bokeh imports
from ..core.has_props import HasProps
from ..document import Document
from ..resources import (
    _COMPONENT_NAMES,
    DEFAULT_SERVER_HTTP_URL,
    ResourceComponent,
    Resources as _Resources,
    _inline_resource,
)
from ..settings import settings
from ..util.compiler import bundle_models
from ._json import canonical_json
from .util import contains_tex_string

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


@dataclass(frozen=True)
class ResourceAssetRequirement:
    '''One extension asset required by an artifact, before host resolution.'''
    kind: Literal["script", "style"]
    url: str | None = None
    content: str | None = None
    integrity: str | None = None
    crossorigin: str | None = None
    module: bool = False

    def __post_init__(self) -> None:
        if self.kind not in ("script", "style"):
            raise ValueError("resource asset requirement kind must be 'script' or 'style'")
        if (self.url is None) == (self.content is None):
            raise ValueError("a resource asset requirement needs exactly one of 'url' or 'content'")
        for name in ("url", "content", "integrity", "crossorigin"):
            value = getattr(self, name)
            if value is not None and not isinstance(value, str):
                raise ValueError(f"resource asset requirement {name} must be a string")
        if not isinstance(self.module, bool):
            raise ValueError("resource asset requirement module must be a boolean")
        if self.kind == "style" and self.module:
            raise ValueError("style resource requirements cannot be JavaScript modules")

    def to_dict(self) -> dict[str, Any]:
        '''Return the JSON-compatible resource requirement.

        Returns:
            A detached resource requirement mapping.
        '''
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
        '''Reconstruct a resource requirement from schema data.

        Args:
            value: The resource requirement mapping.

        Returns:
            A validated resource requirement.
        '''
        if not isinstance(value, Mapping):
            raise ValueError("resource asset requirements must be objects")
        if "nonce" in value:
            raise ValueError("resource asset requirement nonce is host-owned")
        kind = value.get("kind")
        if kind not in ("script", "style"):
            raise ValueError("resource asset requirement kind must be 'script' or 'style'")
        return cls(
            kind=cast(Literal["script", "style"], kind),
            url=value.get("url"),
            content=value.get("content"),
            integrity=value.get("integrity"),
            crossorigin=value.get("crossorigin"),
            module=value.get("module", False),
        )


@dataclass(frozen=True)
class ExtensionRequirement:
    '''Named extension and its ordered script/style requirements.'''
    name: str
    assets: tuple[ResourceAssetRequirement, ...] = ()

    def __post_init__(self) -> None:
        object.__setattr__(self, "assets", tuple(self.assets))
        if not isinstance(self.name, str) or not self.name:
            raise ValueError("resource extension names must be non-empty strings")
        if any(not isinstance(asset, ResourceAssetRequirement) for asset in self.assets):
            raise ValueError("resource extension assets must be ResourceAssetRequirement instances")

    def to_dict(self) -> dict[str, Any]:
        '''Return the JSON-compatible extension requirement.

        Returns:
            A detached extension requirement mapping.
        '''
        return {"name": self.name, "assets": [asset.to_dict() for asset in self.assets]}

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> ExtensionRequirement:
        '''Reconstruct an extension requirement from schema data.

        Args:
            value: The extension requirement mapping.

        Returns:
            A validated extension requirement.
        '''
        if not isinstance(value, Mapping):
            raise ValueError("resource extension requirements must be objects")
        assets = value.get("assets", [])
        if not isinstance(assets, list):
            raise ValueError("resource extension assets must be an array")
        name = value.get("name")
        if not isinstance(name, str) or not name:
            raise ValueError("resource extension names must be non-empty strings")
        return cls(
            name=name,
            assets=tuple(ResourceAssetRequirement.from_dict(asset) for asset in assets),
        )


@dataclass(frozen=True)
class ResourceRequirements:
    '''Exact runtime components and extension assets declared by artifacts.'''
    components: tuple[ResourceComponent, ...] = ("bokeh/core",)
    extensions: tuple[ExtensionRequirement, ...] = ()

    def __post_init__(self) -> None:
        object.__setattr__(self, "components", tuple(self.components))
        object.__setattr__(self, "extensions", tuple(self.extensions))
        unknown = [component for component in self.components if component not in _COMPONENT_NAMES]
        if unknown:
            raise ValueError(f"unknown Bokeh resource components: {unknown!r}")
        if len(self.components) != len(set(self.components)):
            raise ValueError("Bokeh resource components must be unique")
        names = [extension.name for extension in self.extensions]
        if len(names) != len(set(names)):
            raise ValueError("Bokeh extension requirements must have unique names")

    def to_dict(self) -> dict[str, Any]:
        '''Return the JSON-compatible requirement set.

        Returns:
            A detached resource requirements mapping.
        '''
        return {
            "components": list(self.components),
            "extensions": [extension.to_dict() for extension in self.extensions],
        }

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> ResourceRequirements:
        '''Reconstruct resource requirements from schema data.

        Args:
            value: The resource requirements mapping.

        Returns:
            A validated resource requirement set.
        '''
        if not isinstance(value, Mapping):
            raise ValueError("artifact resource requirements must be an object")
        components = value.get("components")
        extensions = value.get("extensions")
        if not isinstance(components, list):
            raise ValueError("artifact resource components must be an array")
        if not isinstance(extensions, list):
            raise ValueError("artifact resource extensions must be an array")
        if any(not isinstance(component, str) or component not in _COMPONENT_NAMES for component in components):
            raise ValueError("artifact resource components contain an unknown component")
        return cls(
            components=cast(tuple[ResourceComponent, ...], tuple(components)),
            extensions=tuple(ExtensionRequirement.from_dict(extension) for extension in extensions),
        )

    @classmethod
    def dynamic_server(cls) -> ResourceRequirements:
        '''Return the conservative requirement set for an unknown live document.

        Returns:
            Requirements covering every built-in runtime component.
        '''
        return cls(("bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/webgl", "bokeh/mathjax", "bokeh/api"))

    @classmethod
    def union(cls, *requirements: ResourceRequirements) -> ResourceRequirements:
        '''Return a deterministic exact union of resource requirements.

        Args:
            requirements: The requirement sets to combine.

        Returns:
            The combined requirement set.
        '''
        components = cast(tuple[ResourceComponent, ...], tuple(
            component for component in _COMPONENT_NAMES
            if any(component in requirement.components for requirement in requirements)
        ))
        extensions: dict[str, list[ResourceAssetRequirement]] = {}
        for requirement in requirements:
            for extension in requirement.extensions:
                assets = extensions.setdefault(extension.name, [])
                for asset in extension.assets:
                    if asset not in assets:
                        assets.append(asset)
        return cls(
            components,
            tuple(ExtensionRequirement(name, tuple(assets)) for name, assets in sorted(extensions.items())),
        )


@dataclass(frozen=True)
class ResolvedResource:
    '''One concrete script or style selected by a host resource policy.'''
    kind: Literal["script", "style"]
    url: str | None = None
    content: str | None = None
    integrity: str | None = None
    crossorigin: str | None = None
    nonce: str | None = None
    module: bool = False

    @property
    def identity(self) -> tuple[Any, ...]:
        '''Return the host-independent identity used for deduplication.

        Returns:
            A tuple describing the resource declaration.
        '''
        return (self.kind, self.url, self.content, self.integrity, self.crossorigin, self.module)

    def to_dict(self) -> dict[str, Any]:
        '''Return the JSON-compatible resolved resource.

        Returns:
            A detached resolved resource mapping.
        '''
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
    '''Requirements plus the policy and concrete assets that satisfy them.'''
    requirements: ResourceRequirements
    policy: _Resources
    bokeh_version: str
    assets: tuple[ResolvedResource, ...] = ()

    def to_dict(self) -> dict[str, Any]:
        '''Return the JSON-compatible resolved resource set.

        Returns:
            A detached resolved resources mapping.
        '''
        return {
            "bokeh_version": self.bokeh_version,
            "policy": self.policy.to_dict(),
            "assets": [asset.to_dict() for asset in self.assets],
        }

    @property
    def fingerprint(self) -> str:
        '''Return a stable fingerprint of the resolved resource plan.

        Returns:
            A hexadecimal SHA-256 digest.
        '''
        policy = self.policy.to_dict()
        policy.pop("base_dir", None)
        policy.pop("root_dir", None)
        payload = {
            "requirements": self.requirements.to_dict(),
            "policy": policy,
            "assets": [asset.to_dict() for asset in self.assets],
        }
        payload["bokeh_version"] = self.bokeh_version
        encoded = canonical_json(payload)
        return hashlib.sha256(encoded.encode("utf-8")).hexdigest()




#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@dataclass(frozen=True)
class URL:
    """Opaque URL used by legacy resource bundles and extension routes."""
    url: str

    def __truediv__(self, path: str) -> URL:
        base = self.url if self.url.endswith("/") else f"{self.url}/"
        return URL(urljoin(base, path.replace(os.sep, "/")))

    def __str__(self) -> str:
        return self.url


@dataclass(frozen=True)
class _ExtensionBundle:
    artifact_path: Path
    server_url: URL
    cdn_url: URL | None = None


class _PackageMetadata(TypedDict):
    name: NotRequired[str]
    version: NotRequired[str]
    module: NotRequired[str]
    main: NotRequired[str]


_DEFAULT_EXTENSION_CDN = URL("https://unpkg.com")
extension_dirs: dict[str, Path] = {}


def bundle_extensions(objs: set[HasProps] | None, policy: _Resources) -> list[_ExtensionBundle]:
    names: set[str] = set()
    bundles: list[_ExtensionBundle] = []
    extensions = [".min.js", ".js"] if policy.minified else [".js"]
    all_objs = objs if objs is not None else HasProps.model_class_reverse_map.values()

    for obj in all_objs:
        if hasattr(obj, "__implementation__"):
            continue
        name = obj.__view_module__.split(".")[0]
        if name == "bokeh" or name in names:
            continue
        names.add(name)
        module = __import__(name)
        if module.__file__ is None:
            continue
        base_dir = Path(module.__file__).absolute().parent
        dist_dir = base_dir / "dist"
        if not (base_dir / "bokeh.ext.json").exists():
            continue

        package_path = base_dir / "package.json"
        package: _PackageMetadata | None = None
        if package_path.exists():
            try:
                package = json.loads(package_path.read_text())
            except json.JSONDecodeError:
                package = None

        cdn_url: URL | None = None
        if package is not None:
            package_name = package.get("name")
            if package_name is None:
                raise ValueError("invalid package.json; missing package name")
            package_version = package.get("version", "latest")
            package_main = package.get("module", package.get("main"))
            if package_main is not None:
                package_main_path = Path(normpath(package_main))
                cdn_url = _DEFAULT_EXTENSION_CDN / f"{package_name}@{package_version}" / str(package_main_path)
            else:
                package_main_path = dist_dir / f"{name}.js"
            artifact_path = base_dir / package_main_path
            server_path = f"{name}/{artifact_path.name}"
            if not settings.dev:
                version_hash = hashlib.sha256(package_version.encode()).hexdigest()
                server_path = f"{server_path}?v={version_hash}"
        else:
            for extension in extensions:
                artifact_path = dist_dir / f"{name}{extension}"
                server_path = f"{name}/{name}{extension}"
                if artifact_path.exists():
                    break
            else:
                raise ValueError(f"can't resolve artifact path for '{name}' extension")

        extension_dirs[name] = artifact_path.parent
        server_url = URL(policy.root_url or DEFAULT_SERVER_HTTP_URL) / "static" / "extensions" / server_path
        bundles.append(_ExtensionBundle(artifact_path, server_url, cdn_url))

    return bundles


def all_objs(objs: Sequence[HasProps | Document]) -> set[HasProps]:
    all_objs: set[HasProps] = set()
    for obj in objs:
        if isinstance(obj, Document):
            for root in obj.roots:
                all_objs |= root.references()
        else:
            all_objs |= cast(Any, obj).references()
    return all_objs


def _query_extensions(all_objs: set[HasProps], query: Callable[[type[HasProps]], bool]) -> bool:
    names: set[str] = set()
    for obj in all_objs:
        if hasattr(obj, "__implementation__"):
            continue
        name = obj.__view_module__.split(".")[0]
        if name == "bokeh" or name in names:
            continue
        names.add(name)
        if any(model.__module__.startswith(name) and query(model) for model in HasProps.model_class_reverse_map.values()):
            return True
    return False


def use_tables(all_objs: set[HasProps]) -> bool:
    from ..models.widgets import TableWidget
    return any(isinstance(obj, TableWidget) for obj in all_objs) or _query_extensions(
        all_objs, lambda cls: issubclass(cls, TableWidget),
    )


def use_widgets(all_objs: set[HasProps]) -> bool:
    from ..models.widgets import Widget
    return any(isinstance(obj, Widget) for obj in all_objs) or _query_extensions(
        all_objs, lambda cls: issubclass(cls, Widget),
    )


def _model_requires_mathjax(model: HasProps) -> bool:
    from ..models.annotations import TextAnnotation
    from ..models.axes import Axis
    from ..models.widgets.markups import Div, Paragraph
    from ..models.widgets.sliders import AbstractSlider

    if isinstance(model, TextAnnotation) and isinstance(model.text, str) and contains_tex_string(model.text):
        return True
    if isinstance(model, AbstractSlider) and isinstance(model.title, str) and contains_tex_string(model.title):
        return True
    if isinstance(model, Axis):
        if isinstance(model.axis_label, str) and contains_tex_string(model.axis_label):
            return True
        if any(isinstance(value, str) and contains_tex_string(value) for value in model.major_label_overrides.values()):
            return True
    if isinstance(model, Div) and not model.disable_math and not model.render_as_text:
        return contains_tex_string(model.text)
    if isinstance(model, Paragraph) and not model.disable_math:
        return contains_tex_string(model.text)
    return False


def use_mathjax(all_objs: set[HasProps]) -> bool:
    from ..models.glyphs import MathTextGlyph
    from ..models.text import MathText
    return (
        any(isinstance(obj, (MathTextGlyph, MathText)) or _model_requires_mathjax(obj) for obj in all_objs)
        or _query_extensions(all_objs, lambda cls: issubclass(cls, MathText))
    )


def use_gl(all_objs: set[HasProps]) -> bool:
    from ..models.plots import Plot
    return any(isinstance(obj, Plot) and obj.output_backend == "webgl" for obj in all_objs)


#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def requirements_for_objs(objs: Sequence[HasProps | Document]) -> ResourceRequirements:
    '''Inspect Bokeh objects and return their exact component/extension requirements.'''
    all_objects = all_objs(objs)
    components: list[ResourceComponent] = ["bokeh/core"]
    if use_widgets(all_objects):
        components.append("bokeh/widgets")
    if use_tables(all_objects):
        components.append("bokeh/tables")
    if use_gl(all_objects):
        components.append("bokeh/webgl")
    if use_mathjax(all_objects):
        components.append("bokeh/mathjax")
    components.append("bokeh/api")

    extensions: dict[str, list[ResourceAssetRequirement]] = {}
    seen_assets: set[tuple[Any, ...]] = set()
    for obj in sorted(all_objects, key=lambda value: (
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

    package_policy = _Resources(mode="inline")
    for package in bundle_extensions(all_objects, package_policy):
        name = f"package:{package.artifact_path.stem}"
        assets = extensions.setdefault(name, [])
        assets.append(ResourceAssetRequirement("script", content=_inline_resource(package.artifact_path)))

    custom_classes = sorted(
        {obj.__class__ for obj in all_objects if hasattr(obj, "__implementation__")},
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


__all__ = (
    "ExtensionRequirement",
    "ResolvedResource",
    "ResolvedResources",
    "ResourceAssetRequirement",
    "ResourceRequirements",
    "requirements_for_objs",
)
