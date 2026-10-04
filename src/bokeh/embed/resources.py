#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Resource requirements and delivery policies for embed results."""

from __future__ import annotations

# Standard library imports
import hashlib
import json
import os
from dataclasses import dataclass, field
from functools import cache
from os.path import normpath
from pathlib import Path
from typing import (
    Any,
    Callable,
    Iterable,
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
from ..core.property.bases import ParameterizedProperty, Property
from ..core.property.container import Dict, Seq, Tuple
from ..core.property.descriptors import UnsetValueError
from ..core.property.string import MathString
from ..document import Document
from ..resources import (
    _COMPONENT_NAMES,
    DEFAULT_SERVER_HTTP_URL,
    ResourceComponent,
    Resources as _Resources,
)
from ..settings import settings
from ..util.compiler import CompilationError, bundle_models
from ._util import canonical_embed_json, contains_tex_string

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


@dataclass(frozen=True)
class ResourceAssetRequirement:
    '''One extension asset required by an embed result, before host resolution.'''
    kind: Literal["script", "style"]
    url: str | None = None
    content: str | None = None
    integrity: str | None = None
    crossorigin: str | None = None
    module: bool = False
    package: str | None = None

    def __post_init__(self) -> None:
        if self.kind not in ("script", "style"):
            raise ValueError("resource asset requirement kind must be 'script' or 'style'")
        if sum(value is not None for value in (self.url, self.content, self.package)) != 1:
            raise ValueError("a resource asset requirement needs exactly one of 'url', 'content', or 'package'")
        for name in ("url", "content", "package", "integrity", "crossorigin"):
            value = getattr(self, name)
            if value is not None and not isinstance(value, str):
                raise ValueError(f"resource asset requirement {name} must be a string")
        if self.package == "":
            raise ValueError("resource asset requirement package must be a non-empty string")
        if not isinstance(self.module, bool):
            raise ValueError("resource asset requirement module must be a boolean")
        if self.kind == "style" and self.module:
            raise ValueError("style resource requirements cannot be JavaScript modules")
        if self.kind == "style" and self.package is not None:
            raise ValueError("packaged extension requirements must be scripts")

    def to_dict(self) -> dict[str, Any]:
        '''Return the JSON-compatible resource requirement.

        Returns:
            A detached resource requirement mapping.
        '''
        result: dict[str, Any] = {"kind": self.kind}
        for name in ("url", "content", "package", "integrity", "crossorigin"):
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
        _reject_unknown_fields(
            value, {"kind", "url", "content", "package", "integrity", "crossorigin", "module"},
            "resource asset requirement",
        )
        kind = value.get("kind")
        if kind not in ("script", "style"):
            raise ValueError("resource asset requirement kind must be 'script' or 'style'")
        return cls(
            kind=cast(Literal["script", "style"], kind),
            url=value.get("url"),
            content=value.get("content"),
            package=value.get("package"),
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
        _reject_unknown_fields(value, {"name", "assets"}, "resource extension requirement")
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


def _ordered_extension_requirements(
    extensions: Mapping[str, Sequence[ResourceAssetRequirement]],
) -> tuple[ExtensionRequirement, ...]:
    names = sorted(name for name in extensions if name != "bokeh.custom-models")
    if "bokeh.custom-models" in extensions:
        names.append("bokeh.custom-models")
    return tuple(ExtensionRequirement(name, tuple(extensions[name])) for name in names)


@dataclass(frozen=True)
class ResourceRequirements:
    '''Exact runtime components and extension assets declared by embed results.'''
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
            raise ValueError("embed resource requirements must be an object")
        _reject_unknown_fields(value, {"components", "extensions"}, "embed resource requirements")
        components = value.get("components")
        extensions = value.get("extensions")
        if not isinstance(components, list):
            raise ValueError("embed resource components must be an array")
        if not isinstance(extensions, list):
            raise ValueError("embed resource extensions must be an array")
        if any(not isinstance(component, str) or component not in _COMPONENT_NAMES for component in components):
            raise ValueError("embed resource components contain an unknown component")
        return cls(
            components=cast(tuple[ResourceComponent, ...], tuple(components)),
            extensions=tuple(ExtensionRequirement.from_dict(extension) for extension in extensions),
        )

    @classmethod
    def dynamic_server(cls) -> ResourceRequirements:
        '''Return the conservative requirement set for an unknown live document.

        Returns:
            Requirements covering every built-in runtime component. The
            server bootstrap supplies registered extension requirements.
        '''
        return cls(("bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/webgl", "bokeh/mathjax"))

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
            _ordered_extension_requirements(extensions),
        )

    def without_extension_assets(self, names: Iterable[str] | None = None) -> ResourceRequirements:
        '''Return requirements whose selected extension assets are supplied separately.'''
        selected = None if names is None else frozenset(names)
        return ResourceRequirements(
            self.components,
            tuple(
                ExtensionRequirement(extension.name)
                if selected is None or extension.name in selected
                else extension
                for extension in self.extensions
            ),
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
    content_sha256: str | None = field(init=False, default=None)

    def __post_init__(self) -> None:
        if self.content is not None:
            object.__setattr__(
                self, "content_sha256", hashlib.sha256(self.content.encode("utf-8")).hexdigest(),
            )

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
        if self.content_sha256 is not None:
            result["content_sha256"] = self.content_sha256
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
    fingerprint: str = field(init=False)

    def __post_init__(self) -> None:
        object.__setattr__(self, "assets", tuple(self.assets))
        policy = self.policy.to_dict()
        policy.pop("base_dir", None)
        policy.pop("root_dir", None)
        assets = []
        for asset in self.assets:
            value = asset.to_dict()
            value.pop("content", None)
            assets.append(value)
        payload = {
            "requirements": self.requirements.to_dict(),
            "policy": policy,
            "assets": assets,
            "bokeh_version": self.bokeh_version,
        }
        encoded = canonical_embed_json(payload)
        object.__setattr__(self, "fingerprint", hashlib.sha256(encoded.encode("utf-8")).hexdigest())

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

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@dataclass(frozen=True)
class _ExtensionBundle:
    name: str
    artifact_path: Path
    server_url: str
    cdn_url: str | None = None


class _PackageMetadata(TypedDict):
    name: NotRequired[str]
    version: NotRequired[str]
    module: NotRequired[str]
    main: NotRequired[str]


_DEFAULT_EXTENSION_CDN = "https://unpkg.com"
extension_dirs: dict[str, Path] = {}


def _join_extension_url(base: str, *parts: str) -> str:
    result = base
    for part in parts:
        base_url = result if result.endswith("/") else f"{result}/"
        result = urljoin(base_url, part.replace(os.sep, "/"))
    return result


def bundle_extensions(objs: Iterable[HasProps | type[HasProps]] | None, policy: _Resources) -> list[_ExtensionBundle]:
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

        cdn_url: str | None = None
        if package is not None:
            package_name = package.get("name")
            if package_name is None:
                raise ValueError("invalid package.json; missing package name")
            package_version = package.get("version", "latest")
            package_main = package.get("module", package.get("main"))
            if package_main is not None:
                package_main_path = Path(normpath(package_main))
                cdn_url = _join_extension_url(
                    _DEFAULT_EXTENSION_CDN, f"{package_name}@{package_version}", str(package_main_path),
                )
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
        server_url = _join_extension_url(
            policy.root_url or DEFAULT_SERVER_HTTP_URL, "static", "extensions", server_path,
        )
        bundles.append(_ExtensionBundle(name, artifact_path, server_url, cdn_url))

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


def _property_supports_math_text(prop: Property[Any]) -> bool:
    return isinstance(prop, MathString) or (
        isinstance(prop, ParameterizedProperty)
        and any(_property_supports_math_text(type_param) for type_param in prop.type_params)
    )


@cache
def _math_text_properties(model_type: type[HasProps]) -> tuple[tuple[str, Property[Any]], ...]:
    return tuple(
        (name, prop) for name, prop in model_type.properties().items()
        if _property_supports_math_text(prop)
    )


def _property_value_requires_mathjax(prop: Property[Any], value: Any) -> bool:
    if isinstance(prop, MathString):
        return isinstance(value, str) and contains_tex_string(value)
    if isinstance(prop, Dict):
        return isinstance(value, Mapping) and any(
            _property_value_requires_mathjax(prop.keys_type, key)
            or _property_value_requires_mathjax(prop.values_type, item)
            for key, item in value.items()
        )
    if isinstance(prop, Tuple):
        return isinstance(value, (tuple, list)) and len(value) == len(prop.type_params) and any(
            _property_value_requires_mathjax(type_param, item)
            for type_param, item in zip(prop.type_params, value)
        )
    if isinstance(prop, Seq):
        return prop.is_valid(value) and any(
            _property_value_requires_mathjax(prop.item_type, item) for item in value
        )
    if isinstance(prop, ParameterizedProperty):
        return any(
            type_param.is_valid(value) and _property_value_requires_mathjax(type_param, value)
            for type_param in prop.type_params
        )
    return False


def _model_requires_mathjax(model: HasProps) -> bool:
    if getattr(model, "disable_math", False) or getattr(model, "render_as_text", False):
        return False
    for name, prop in _math_text_properties(cast(Any, type(model))):
        try:
            value = getattr(model, name)
        except UnsetValueError:
            continue
        if _property_value_requires_mathjax(prop, value):
            return True
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

def _extension_requirements(model_types: set[type[HasProps]], *,
        include_custom_models: bool = True) -> tuple[ExtensionRequirement, ...]:
    extensions: dict[str, list[ResourceAssetRequirement]] = {}
    seen_assets: set[tuple[Any, ...]] = set()
    for cls in sorted(model_types, key=lambda value: (value.__module__, value.__name__)):
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
        if not assets:
            extensions.pop(extension_name, None)

    package_policy = _Resources(mode="none")
    for package in bundle_extensions(model_types, package_policy):
        name = f"package:{package.name}"
        assets = extensions.setdefault(name, [])
        assets.append(ResourceAssetRequirement("script", package=package.name))

    if include_custom_models:
        custom_classes = sorted(
            {cls for cls in model_types if hasattr(cls, "__implementation__")},
            key=lambda cls: (cls.__module__, cls.__name__),
        )
        try:
            custom_bundle = bundle_models(custom_classes) if custom_classes else None
        except CompilationError as error:
            detail = str(error).strip() or "unknown compilation error"
            raise ValueError(f"failed to compile custom models: {detail}") from error
        if custom_bundle is not None:
            extensions.setdefault("bokeh.custom-models", []).append(
                ResourceAssetRequirement("script", content=custom_bundle),
            )

    # Compiled model implementations may depend on external or packaged
    # extension assets declared above, so their aggregate bundle runs last.
    return _ordered_extension_requirements(extensions)


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
    model_types = {obj.__class__ for obj in all_objects}
    return ResourceRequirements(tuple(components), _extension_requirements(model_types))


def requirements_for_all_models(*, include_custom_models: bool = True,
        model_types: Iterable[type[HasProps]] | None = None) -> ResourceRequirements:
    '''Return conservative requirements for every registered model type.

    Args:
        include_custom_models: Include the compiled bundle for models with
            inline implementations. Hosts that load exact custom bundles with
            each payload can omit the eager aggregate bundle.
        model_types: An optional immutable snapshot of registered model types.
    '''
    registered = set(HasProps.model_class_reverse_map.values() if model_types is None else model_types)
    return ResourceRequirements(
        ("bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/webgl", "bokeh/mathjax"),
        _extension_requirements(registered, include_custom_models=include_custom_models),
    )


def resolve_server_extensions(policy: _Resources,
        model_types: Iterable[type[HasProps]] | None = None) -> ResolvedResources:
    '''Resolve every registered extension requirement for a live server session.

    Extension registration is process-global, and a live document may add model
    types after its initial session document is created. Asset-delivering modes
    therefore intentionally resolve the whole registered-model set. Host-owned
    mode has no assets to deliver and can bypass that global discovery entirely.
    '''
    if policy.mode == "none":
        return policy.resolve(ResourceRequirements((), ()), include_requirement_assets=False)
    snapshot = tuple(
        HasProps.model_class_reverse_map.values() if model_types is None else model_types,
    )
    requirements = requirements_for_all_models(model_types=snapshot)
    extension_requirements = ResourceRequirements((), requirements.extensions)
    return policy.resolve(
        extension_requirements,
        include_requirement_assets=False,
        extension_model_types=snapshot,
    )


def server_extension_resources(default: _Resources, *, mode: str | None,
        minified: str | None, root_url: str) -> _Resources:
    '''Apply a browser host's requested policy to server extension assets.'''
    if mode is None:
        if minified is not None:
            raise ValueError("Bokeh-Resource-Minified requires Bokeh-Resource-Mode")
        return default
    if mode in ("relative", "absolute"):
        raise ValueError(
            f"server bootstrap cannot resolve {mode} extension paths for an embedding host. "
            "Use server, CDN, inline, or host-owned resources",
        )
    if mode not in ("none", "inline", "offline", "cdn", "server"):
        raise ValueError(f"unknown server extension resource mode {mode!r}")
    if minified is None:
        use_minified = default.minified
    elif minified == "true":
        use_minified = True
    elif minified == "false":
        use_minified = False
    else:
        raise ValueError("Bokeh-Resource-Minified must be 'true' or 'false'")
    if mode == "server":
        return _Resources(mode="server", minified=use_minified, root_url=root_url)
    return _Resources(mode=cast(Any, mode), minified=use_minified)


def resolve_package_requirement(name: str, policy: _Resources, *,
        model_types: Iterable[type[HasProps]] | None = None) -> _ExtensionBundle:
    '''Resolve one logical packaged extension under a concrete host policy.'''
    registered = HasProps.model_class_reverse_map.values() if model_types is None else model_types
    selected = {
        model_type for model_type in registered
        if model_type.__view_module__.split(".", 1)[0] == name
    }
    for bundle in bundle_extensions(selected, policy):
        if bundle.name == name:
            return bundle
    raise ValueError(f"can't resolve registered packaged extension {name!r}")


def _reject_unknown_fields(value: Mapping[str, Any], allowed: set[str], context: str) -> None:
    unknown = sorted(set(value) - allowed)
    if unknown:
        raise ValueError(f"{context} contains unknown fields: {unknown!r}")


__all__ = (
    "ExtensionRequirement",
    "ResolvedResource",
    "ResolvedResources",
    "ResourceAssetRequirement",
    "ResourceRequirements",
    "requirements_for_all_models",
    "requirements_for_objs",
    "server_extension_resources",
)
