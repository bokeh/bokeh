#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""HTML and MIME output for :class:`~bokeh.embed.EmbedResult`."""

from __future__ import annotations

# Standard library imports
import json
import re
from dataclasses import dataclass
from html import escape
from pathlib import Path, PureWindowsPath
from types import SimpleNamespace
from typing import (
    TYPE_CHECKING,
    Any,
    Iterator,
    Literal,
    Mapping,
)
from urllib.parse import urlsplit

# Bokeh imports
from ..core.templates import FILE, MACROS, get_env
from ..document import DEFAULT_TITLE
from ..resources import ResourceConflictError, Resources
from ..settings import settings
from ..util.serialization import make_globally_unique_css_safe_id
from ._util import embed_source, project_embed_result
from .resources import ResolvedResource, ResolvedResources, ResourceRequirements
from .result import EMBED_MIME_TYPE, EmbedResult

if TYPE_CHECKING:
    from jinja2 import Template

    from ..resources import ResourcesLike


@dataclass(frozen=True)
class EmbedMount:
    '''One logical root key and its declarative target markup.'''
    key: str
    html: str


class _TemplateRoots:
    def __init__(self, mounts: tuple[EmbedMount, ...], aliases: Mapping[str, EmbedMount]) -> None:
        self._mounts = mounts
        self._aliases = aliases

    def __iter__(self) -> Iterator[EmbedMount]:
        return iter(self._mounts)

    def __len__(self) -> int:
        return len(self._mounts)

    def __getitem__(self, key: int | str) -> EmbedMount:
        return self._mounts[key] if isinstance(key, int) else self._aliases[key]

    def __getattr__(self, key: str) -> EmbedMount:
        try:
            return self._aliases[key]
        except KeyError as error:
            raise AttributeError(key) from error


@dataclass(frozen=True)
class EmbedFragment:
    '''Composable embed output for insertion into an existing page.

    ``mounts`` and ``divs`` expose caller-placeable targets. ``script`` contains
    payload/bootstrap declarations. ``resources`` records the resolved host
    policy.
    '''
    result: EmbedResult
    mounts: tuple[EmbedMount, ...]
    script: str
    resources: ResolvedResources
    html: str

    @property
    def requirements(self) -> ResourceRequirements:
        '''Return the resource requirements declared by the embed result.

        Returns:
            The embed result resource requirements.
        '''
        return self.result.requires

    @property
    def divs(self) -> dict[str, str]:
        '''Return target markup keyed by logical root name.

        Returns:
            A mapping from root keys to target markup.
        '''
        return {mount.key: mount.html for mount in self.mounts}


@dataclass(frozen=True)
class ExternalEmbed:
    '''Declarative targets, payload, and bootstrap for external storage.

    ``result`` retains the reusable caller result. ``payload`` contains the
    transport projection matching the resources rendered alongside it.
    '''
    result: EmbedResult
    payload_url: str
    payload: str
    mounts: tuple[EmbedMount, ...]
    bootstrap: str
    resources: ResolvedResources
    html: str

def render_fragment(result: EmbedResult, *, resources: ResourcesLike | None = "none",
        bootstrap_url: str | None = None) -> EmbedFragment:
    '''Render an embed result for composition inside a host-owned HTML page.'''
    _, mounts, script, resolved = _render_inline_parts(result, resources, bootstrap_url)
    html = "\n".join(filter(None, (_render_resources(resolved), *(mount.html for mount in mounts), script)))
    return EmbedFragment(result, mounts, script, resolved, html)


def _render_inline_parts(result: EmbedResult, resources: ResourcesLike | None,
        bootstrap_url: str | None,
) -> tuple[EmbedResult, tuple[EmbedMount, ...], str, ResolvedResources]:
    policy = _resources_for_embed(result, resources)
    if bootstrap_url is not None and policy.integrity:
        raise ResourceConflictError(
            "a custom bootstrap_url cannot satisfy integrity=True; use Bokeh's standard bootstrap asset",
        )
    resolved = policy.resolve(
        result.requires,
        bokeh_version=result.bokeh_version,
        include_requirement_assets=policy.mode == "none",
    )
    transported = project_embed_result(result, resolved.requirements)
    declaration_id = make_globally_unique_css_safe_id()
    mounts = render_mounts(transported, declaration_id=declaration_id)
    if policy.external_only:
        raise ValueError(
            "external_only resource policy cannot embed an inline payload; "
            "use result.external(payload_url=...)",
        )
    payload = _payload_tag(transported, declaration_id=declaration_id, nonce=policy.nonce)
    bootstrap = (
        _inline_bootstrap(
            declaration_id=declaration_id, nonce=policy.nonce,
            resource_policy=policy,
        )
        if bootstrap_url is None
        else _external_bootstrap(
            bootstrap_url, declaration_id=declaration_id, nonce=policy.nonce,
            resource_policy=policy,
        )
    )
    document_target = ""
    if result.metadata.get("embedding", {}).get("full_document") is True:
        document_target = (
            '<div data-bokeh-document-target '
            f'data-bokeh-embed-instance="{escape(declaration_id, quote=True)}"></div>\n'
        )
    script = f"{document_target}{payload}\n{bootstrap}"
    return transported, mounts, script, resolved


def render_external(result: EmbedResult, *, payload_url: str,
        resources: ResourcesLike | None = "none",
        bootstrap_url: str | None = None) -> ExternalEmbed:
    '''Render a declaration that fetches an embed payload from ``payload_url``.'''
    if not payload_url:
        raise ValueError("external embed rendering requires a non-empty payload_url")
    _validate_web_url(payload_url, "payload_url")
    policy = _resources_for_embed(result, resources)
    if bootstrap_url is not None and policy.integrity:
        raise ResourceConflictError(
            "a custom bootstrap_url cannot satisfy integrity=True; use Bokeh's standard bootstrap asset",
        )
    resolved = policy.resolve(
        result.requires,
        bokeh_version=result.bokeh_version,
        include_requirement_assets=policy.mode == "none",
    )
    transported = project_embed_result(result, resolved.requirements)
    declaration_id = make_globally_unique_css_safe_id()
    mounts = render_mounts(transported, payload_url=payload_url, declaration_id=declaration_id)
    if bootstrap_url is None:
        if policy.external_only:
            asset = policy.resolve_embed_bootstrap(bokeh_version=result.bokeh_version)
            assert asset.url is not None
            bootstrap = _external_bootstrap(
                asset.url, declaration_id=declaration_id,
                payload_url=payload_url, nonce=asset.nonce,
                integrity=asset.integrity, crossorigin=asset.crossorigin,
                resource_policy=policy, allow_absolute_path=policy.mode == "absolute",
            )
        else:
            bootstrap = _inline_bootstrap(
                declaration_id=declaration_id,
                payload_url=payload_url, nonce=policy.nonce, resource_policy=policy,
            )
    else:
        bootstrap = _external_bootstrap(
            bootstrap_url, declaration_id=declaration_id,
            payload_url=payload_url, nonce=policy.nonce,
            crossorigin=policy.crossorigin,
            resource_policy=policy,
        )
    html = "\n".join(filter(None, (_render_resources(resolved), *(mount.html for mount in mounts), bootstrap)))
    return ExternalEmbed(
        result, payload_url, transported.to_json_string(), mounts, bootstrap, resolved, html,
    )


def render_page(result: EmbedResult, *, resources: ResourcesLike | None = None,
        title: str | None = None, template: Template | str | Path | None = None,
        template_variables: Mapping[str, Any] | None = None, bootstrap_url: str | None = None) -> str:
    '''Render a complete HTML document with resolved resources and targets.'''
    _, mounts, plot_script, resolved = _render_inline_parts(result, resources, bootstrap_url)
    plot_div = "\n".join(mount.html for mount in mounts)
    bokeh_js = _render_resources(resolved, kind="script")
    bokeh_css = _render_resources(resolved, kind="style")
    template_roots = _template_roots(result, mounts)

    context = dict(template_variables or {})
    context.update(
        title=title if title is not None else _embed_title(result),
        bokeh_js=bokeh_js,
        bokeh_css=bokeh_css,
        bokeh_nonce=resolved.policy.nonce,
        plot_script=plot_script,
        plot_div=plot_div,
        embed_result=result,
        embed_mounts=mounts,
        embed_fragment=f"{plot_div}\n{plot_script}",
        docs=[SimpleNamespace(roots=template_roots, elementid=None)],
        roots=template_roots,
        base=FILE,
        macros=MACROS,
    )

    if template is None:
        renderer = FILE
    elif isinstance(template, Path):
        renderer = get_env().from_string("{% extends base %}\n" + template.read_text())
    elif isinstance(template, str):
        renderer = get_env().from_string("{% extends base %}\n" + template)
    elif callable(getattr(template, "render", None)):
        renderer = template
    else:
        raise TypeError(f"expected Template, str, Path, or None, got {type(template).__name__}")
    return renderer.render(context)


def _template_roots(result: EmbedResult, mounts: tuple[EmbedMount, ...]) -> _TemplateRoots:
    aliases = {mount.key: mount for mount in mounts}
    source = embed_source(result)
    if source.get("kind") == "standalone":
        documents = source["documents"]
        models: dict[str, Mapping[str, Any]] | None = None

        def collect(value: Any, definitions: dict[str, Mapping[str, Any]]) -> None:
            if isinstance(value, dict):
                model_id = (
                    value.get("$id") if "$type" in value
                    else value.get("id") if value.get("type") == "object" else None
                )
                if isinstance(model_id, str):
                    definitions[model_id] = value
                for item in value.values():
                    collect(item, definitions)
            elif isinstance(value, list):
                for item in value:
                    collect(item, definitions)

        for descriptor, mount in zip(result.roots, mounts):
            assert descriptor.document is not None and descriptor.root is not None
            root = documents[descriptor.document]["roots"][descriptor.root]
            model_id = root.get("$ref")
            if model_id is None and root.get("type") != "object":
                model_id = root.get("id")
            if model_id is not None:
                if models is None:
                    models = {}
                    collect(documents, models)
                root = models[model_id]
            attributes = root if "$type" in root else root.get("attributes", {})
            name = attributes.get("name")
            if isinstance(name, str) and name:
                aliases.setdefault(name, mount)
    return _TemplateRoots(mounts, aliases)


def render_mimebundle(result: EmbedResult) -> dict[str, Any]:
    '''Return embed payload, HTML fallback, and text representations for rich display.'''
    fragment = render_fragment(result, resources="none")
    return {
        EMBED_MIME_TYPE: result.to_dict(),
        "text/html": fragment.html,
        "text/plain": f"Bokeh EmbedResult ({len(result.roots)} roots)",
    }


def _resources_for_embed(result: EmbedResult, resources: ResourcesLike | None) -> Resources:
    policy = Resources.build(resources)
    source = embed_source(result)
    if policy.mode == "server" and policy.root_url is None and source.get("kind") == "server":
        url = source["url"]
        assert isinstance(url, str)
        if source.get("relative_urls") is True:
            url = urlsplit(url).path
        return Resources.build(policy, root_url=f"{url.rstrip('/')}/")
    return policy


def _embed_title(result: EmbedResult) -> str:
    source = embed_source(result)
    if source.get("kind") == "standalone":
        [document, *_] = source["documents"]
        title = document.get("title")
        if isinstance(title, str) and title:
            return title
    return DEFAULT_TITLE


def render_mounts(result: EmbedResult, *, payload_url: str | None = None,
        declaration_id: str | None = None) -> tuple[EmbedMount, ...]:
    '''Render only caller-placeable target elements, without payloads or resources.'''
    declaration_id = declaration_id or make_globally_unique_css_safe_id()
    mounts: list[EmbedMount] = []
    root_keys = [root.key for root in result.roots]
    source = embed_source(result)
    if source.get("kind") == "server" and not root_keys:
        root_keys.append("*")
    for key in root_keys:
        attrs = {
            "class": "bk-embed-root",
            "data-bokeh-embed-instance": declaration_id,
            "data-bokeh-root": key,
        }
        if payload_url is not None:
            attrs["data-bokeh-payload-url"] = payload_url
        rendered = " ".join(f'{name}="{escape(value, quote=True)}"' for name, value in attrs.items())
        mounts.append(EmbedMount(key, f"<div {rendered}></div>"))
    return tuple(mounts)


def _payload_tag(result: EmbedResult, *, declaration_id: str, nonce: str | None) -> str:
    payload = _html_safe_json(result.to_json_string())
    attrs = [
        f'type="{EMBED_MIME_TYPE}"',
        "data-bokeh-embed-payload",
        f'data-bokeh-embed-instance="{escape(declaration_id, quote=True)}"',
    ]
    if nonce is not None:
        attrs.append(f'nonce="{escape(nonce, quote=True)}"')
    return f"<script {' '.join(attrs)}>{payload}</script>"


def _inline_bootstrap(*, declaration_id: str,
        payload_url: str | None = None, nonce: str | None = None,
        resource_policy: Resources | None = None) -> str:
    attrs = [
        "data-bokeh-embed-bootstrap",
        f'data-bokeh-embed-instance="{escape(declaration_id, quote=True)}"',
    ]
    if nonce is not None:
        attrs.append(f'nonce="{escape(nonce, quote=True)}"')
    if payload_url is not None:
        attrs.append(f'data-bokeh-payload-url="{escape(payload_url, quote=True)}"')
    attrs.extend(_resource_policy_attributes(resource_policy))
    code = f'''(() => {{
  const instance = {json.dumps(declaration_id)}
  const current = document.currentScript
  const declaration = current?.dataset.bokehEmbedInstance == instance ? current : document.querySelector(
    `[data-bokeh-embed-bootstrap][data-bokeh-embed-instance="${{instance}}"]`,
  )
  const deadline = Date.now() + 30_000
  const start = () => {{
    if (globalThis.Bokeh != null) {{
      void Bokeh.mount_embed_declaration(declaration).catch((error) => {{
        console.error("Failed to mount Bokeh embed", error)
      }})
    }} else if (Date.now() < deadline) {{
      setTimeout(start, 25)
    }} else {{
      console.error("Failed to mount Bokeh embed: BokehJS is not loaded")
    }}
  }}
  start()
}})()'''
    return f"<script {' '.join(attrs)}>{code}</script>"


def _external_bootstrap(bootstrap_url: str, *, payload_url: str | None = None,
        declaration_id: str, nonce: str | None = None,
        integrity: str | None = None, crossorigin: str | None = None,
        resource_policy: Resources | None = None, allow_absolute_path: bool = False) -> str:
    _validate_web_url(bootstrap_url, "bootstrap_url", allow_absolute_path=allow_absolute_path)
    attrs = [
        f'src="{escape(bootstrap_url, quote=True)}"',
        "data-bokeh-embed-bootstrap",
        f'data-bokeh-embed-instance="{escape(declaration_id, quote=True)}"',
    ]
    if nonce is not None:
        attrs.append(f'nonce="{escape(nonce, quote=True)}"')
    if integrity is not None:
        attrs.append(f'integrity="{escape(integrity, quote=True)}"')
    if crossorigin is not None:
        attrs.append(f'crossorigin="{escape(crossorigin, quote=True)}"')
    if payload_url is not None:
        attrs.append(f'data-bokeh-payload-url="{escape(payload_url, quote=True)}"')
    attrs.extend(_resource_policy_attributes(resource_policy))
    return f"<script {' '.join(attrs)}></script>"


def _resource_policy_attributes(policy: Resources | None) -> list[str]:
    if policy is None:
        return []
    attrs = [
        f'data-bokeh-resource-mode="{policy.mode}"',
        f'data-bokeh-resource-minified="{str(policy.minified).lower()}"',
        f'data-bokeh-log-level="{escape(settings.log_level(), quote=True)}"',
    ]
    if policy.override_version is not None:
        attrs.append(f'data-bokeh-resource-override-version="{escape(policy.override_version, quote=True)}"')
    if policy.crossorigin is not None:
        attrs.append(f'data-bokeh-resource-crossorigin="{escape(policy.crossorigin, quote=True)}"')
    if policy.integrity:
        attrs.append("data-bokeh-resource-integrity")
    if policy.external_only:
        attrs.append("data-bokeh-resource-external-only")
    return attrs


def _render_resources(resources: ResolvedResources, *, kind: str | None = None) -> str:
    allow_absolute_path = resources.policy.mode == "absolute"
    return "\n".join(
        render_resource(asset, allow_absolute_path=allow_absolute_path)
        for asset in resources.assets if kind is None or asset.kind == kind
    )


def render_resource(asset: ResolvedResource, *, allow_absolute_path: bool = False) -> str:
    '''Render one resolved resource as host-safe HTML.'''
    attributes: list[str] = []
    wrapper_attributes: list[str] = []
    if asset.nonce is not None:
        nonce = f'nonce="{escape(asset.nonce, quote=True)}"'
        attributes.append(nonce)
        wrapper_attributes.append(nonce)
    if asset.integrity is not None:
        attributes.append(f'integrity="{escape(asset.integrity, quote=True)}"')
    if asset.crossorigin is not None:
        attributes.append(f'crossorigin="{escape(asset.crossorigin, quote=True)}"')
    def suffix(state: Literal["loading", "loaded"], *, wrapper: bool = False) -> str:
        selected = wrapper_attributes if wrapper else attributes
        return " " + " ".join([f'data-bokeh-resource-state="{state}"', *selected])

    if asset.kind == "script":
        if asset.url is not None:
            _validate_web_url(asset.url, "script resource URL", allow_absolute_path=allow_absolute_path)
            script_type = ' type="module"' if asset.module else ""
            state: Literal["loading", "loaded"] = "loading" if asset.module else "loaded"
            marker = ' data-bokeh-resource=""' if asset.module else ""
            resource = f'<script src="{escape(asset.url, quote=True)}"{script_type}{marker}{suffix(state)}></script>'
            return resource
        assert asset.content is not None
        assert asset.content_sha256 is not None
        if asset.module:
            asset_json = _html_safe_json(json.dumps(asset.to_dict(), ensure_ascii=False))
            code = f'''void Bokeh.embed.resource_loader.ensure(
  {{components: [], extensions: []}}, {{mode: "resolved", assets: [{asset_json}]}},
).catch((error) => {{ console.error("Failed to load Bokeh module resource", error) }})'''
            return f"<script{suffix('loaded', wrapper=True)}>{code}</script>"
        content = _html_safe_json(json.dumps(asset.content, ensure_ascii=False))
        marker = json.dumps(f"script:sha256:{asset.content_sha256}")
        code = f'''(() => {{
  const loader = document.currentScript
  const resource = document.createElement("script")
  resource.type = "text/javascript"
  resource.text = {content}
  if (loader.nonce != "") resource.nonce = loader.nonce
  for (const name of ["integrity", "crossorigin"]) {{
    const value = loader.getAttribute(name)
    if (value != null) resource.setAttribute(name, value)
  }}
  resource.setAttribute("data-bokeh-resource", {marker})
  resource.setAttribute("data-bokeh-resource-state", "loaded")
  loader.before(resource)
  loader.remove()
}})()'''
        return f"<script{suffix('loaded', wrapper=True)}>{code}</script>"
    if asset.url is not None:
        _validate_web_url(asset.url, "style resource URL", allow_absolute_path=allow_absolute_path)
        return f'<link rel="stylesheet" href="{escape(asset.url, quote=True)}"{suffix("loaded")}>'
    assert asset.content is not None
    assert asset.content_sha256 is not None
    content = re.sub(r"</style", r"<\\/style", asset.content, flags=re.IGNORECASE)
    marker = escape(f"style:sha256:{asset.content_sha256}", quote=True)
    return f'<style data-bokeh-resource="{marker}"{suffix("loaded")}>{content}</style>'


def _validate_web_url(url: str, context: str, *, allow_absolute_path: bool = False) -> None:
    if not isinstance(url, str) or not url:
        raise ValueError(f"{context} must be a non-empty HTTP(S) or relative URL")
    if allow_absolute_path and PureWindowsPath(url).is_absolute():
        return
    parsed = urlsplit(url)
    if parsed.scheme and parsed.scheme.lower() not in ("http", "https"):
        raise ValueError(f"{context} must use HTTP(S) or be relative, received {url!r}")
    if parsed.scheme and not parsed.netloc:
        raise ValueError(f"{context} must include a host, received {url!r}")
    if not parsed.scheme and parsed.netloc:
        raise ValueError(f"{context} cannot be scheme-relative, received {url!r}")


def _html_safe_json(value: str) -> str:
    return value.replace(
        "&", "\\u0026",
    ).replace("<", "\\u003c").replace(">", "\\u003e").replace("\u0085", "\\u0085").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


__all__ = (
    "EmbedFragment",
    "EmbedMount",
    "ExternalEmbed",
    "render_external",
    "render_fragment",
    "render_mimebundle",
    "render_mounts",
    "render_page",
    "render_resource",
)
