#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Typed output renderers for :class:`~bokeh.embed.EmbedArtifact`."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from html import escape
from pathlib import Path
from typing import TYPE_CHECKING, Any, Mapping

from ..core.templates import FILE, MACROS, get_env
from ..document import DEFAULT_TITLE
from .artifact import EMBED_ARTIFACT_MIME_TYPE, EmbedArtifact
from .resources import ResolvedResource, ResolvedResources, ResourcePolicy

if TYPE_CHECKING:
    from jinja2 import Template

    from ..resources import Resources


@dataclass(frozen=True)
class ArtifactMount:
    key: str
    html: str


@dataclass(frozen=True)
class ArtifactFragment:
    artifact: EmbedArtifact
    mounts: tuple[ArtifactMount, ...]
    script: str
    resources: ResolvedResources
    build_fingerprint: str
    html: str

    @property
    def requirements(self):
        return self.artifact.requires

    @property
    def divs(self) -> dict[str, str]:
        return {mount.key: mount.html for mount in self.mounts}


@dataclass(frozen=True)
class ExternalArtifact:
    artifact: EmbedArtifact
    payload_url: str
    mounts: tuple[ArtifactMount, ...]
    bootstrap: str
    resources: ResolvedResources
    build_fingerprint: str
    html: str

    @property
    def payload(self) -> str:
        return self.artifact.to_json_string()


def render_fragment(artifact: EmbedArtifact, *, resources: ResourcePolicy | Resources | str | None = "none",
        bootstrap_url: str | None = None) -> ArtifactFragment:
    policy = ResourcePolicy.build(resources)
    _validate_resource_version(artifact, policy)
    resolved = policy.resolve(artifact.requires)
    mounts = _mounts(artifact)
    if policy.external_only:
        raise ValueError(
            "external_only resource policy cannot embed an inline artifact payload; "
            "use artifact.external(payload_url=..., bootstrap_url=...)",
        )
    payload = _payload_tag(artifact, nonce=policy.nonce)
    bootstrap = _inline_bootstrap(nonce=policy.nonce) if bootstrap_url is None else _external_bootstrap(bootstrap_url)
    script = f"{payload}\n{bootstrap}"
    html = "\n".join(filter(None, (_render_resources(resolved), *(mount.html for mount in mounts), script)))
    build_fingerprint = _build_fingerprint(
        artifact, resolved, "fragment", {"bootstrap_url": bootstrap_url},
    )
    return ArtifactFragment(artifact, mounts, script, resolved, build_fingerprint, html)


def render_external(artifact: EmbedArtifact, *, payload_url: str,
        resources: ResourcePolicy | Resources | str | None = "none",
        bootstrap_url: str | None = None) -> ExternalArtifact:
    if not payload_url:
        raise ValueError("external artifact rendering requires a non-empty payload_url")
    policy = ResourcePolicy.build(resources)
    _validate_resource_version(artifact, policy)
    resolved = policy.resolve(artifact.requires)
    mounts = _mounts(artifact, payload_url=payload_url)
    if bootstrap_url is None:
        if policy.external_only:
            raise ValueError("external_only resource policy requires an external artifact bootstrap_url")
        bootstrap = _inline_bootstrap(payload_url=payload_url, nonce=policy.nonce)
    else:
        bootstrap = _external_bootstrap(bootstrap_url, payload_url=payload_url)
    html = "\n".join(filter(None, (_render_resources(resolved), *(mount.html for mount in mounts), bootstrap)))
    build_fingerprint = _build_fingerprint(
        artifact, resolved, "external", {"payload_url": payload_url, "bootstrap_url": bootstrap_url},
    )
    return ExternalArtifact(artifact, payload_url, mounts, bootstrap, resolved, build_fingerprint, html)


def render_page(artifact: EmbedArtifact, *, resources: ResourcePolicy | Resources | str | None = None,
        title: str | None = None, template: Template | str | Path | None = None,
        template_variables: Mapping[str, Any] | None = None, bootstrap_url: str | None = None) -> str:
    policy = ResourcePolicy.build(resources)
    _validate_resource_version(artifact, policy)
    resolved = policy.resolve(artifact.requires)
    mounts = _mounts(artifact)
    if policy.external_only:
        raise ValueError(
            "external_only resource policy cannot embed an inline artifact payload; "
            "use artifact.external(payload_url=..., bootstrap_url=...)",
        )
    payload = _payload_tag(artifact, nonce=policy.nonce)
    bootstrap = _inline_bootstrap(nonce=policy.nonce) if bootstrap_url is None else _external_bootstrap(bootstrap_url)
    plot_script = f"{payload}\n{bootstrap}"
    plot_div = "\n".join(mount.html for mount in mounts)
    bokeh_js = _render_resources(resolved, kind="script")
    bokeh_css = _render_resources(resolved, kind="style")

    context = dict(template_variables or {})
    context.update(
        title=title or _artifact_title(artifact),
        bokeh_js=bokeh_js,
        bokeh_css=bokeh_css,
        plot_script=plot_script,
        plot_div=plot_div,
        artifact=artifact,
        artifact_mounts=mounts,
        artifact_fragment=f"{plot_div}\n{plot_script}",
        docs=[],
        roots=[],
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


def render_mimebundle(artifact: EmbedArtifact) -> dict[str, Any]:
    fragment = render_fragment(artifact, resources="none")
    return {
        EMBED_ARTIFACT_MIME_TYPE: artifact.to_dict(),
        "text/html": fragment.html,
        "text/plain": f"Bokeh EmbedArtifact {artifact.fingerprint[:12]} ({len(artifact.roots)} roots)",
    }


def _artifact_title(artifact: EmbedArtifact) -> str:
    if artifact.source.get("kind") == "standalone":
        [document, *_] = artifact.source["documents"]
        title = document.get("title")
        if isinstance(title, str) and title:
            return title
    return DEFAULT_TITLE


def _mounts(artifact: EmbedArtifact, *, payload_url: str | None = None) -> tuple[ArtifactMount, ...]:
    result: list[ArtifactMount] = []
    root_keys = [root.key for root in artifact.roots]
    if artifact.source.get("kind") == "server" and not root_keys:
        root_keys.append("*")
    for key in root_keys:
        attrs = {
            "class": "bk-embed-root",
            "data-bokeh-artifact": artifact.fingerprint,
            "data-bokeh-root": key,
        }
        if payload_url is not None:
            attrs["data-bokeh-payload-url"] = payload_url
        rendered = " ".join(f'{name}="{escape(value, quote=True)}"' for name, value in attrs.items())
        result.append(ArtifactMount(key, f"<div {rendered}></div>"))
    return tuple(result)


def _payload_tag(artifact: EmbedArtifact, *, nonce: str | None) -> str:
    payload = _html_safe_json(artifact.to_dict())
    attrs = [f'type="{EMBED_ARTIFACT_MIME_TYPE}"', "data-bokeh-artifact-payload"]
    if nonce is not None:
        attrs.append(f'nonce="{escape(nonce, quote=True)}"')
    return f"<script {' '.join(attrs)}>{payload}</script>"


def _inline_bootstrap(*, payload_url: str | None = None, nonce: str | None = None) -> str:
    attrs = "" if nonce is None else f' nonce="{escape(nonce, quote=True)}"'
    payload_attr = "" if payload_url is None else f' data-bokeh-payload-url="{escape(payload_url, quote=True)}"'
    code = """void Bokeh.mount_artifact_declaration(document.currentScript).catch((error) => {
  console.error("Failed to mount Bokeh artifact", error);
});"""
    return f"<script{attrs}{payload_attr}>{code}</script>"


def _external_bootstrap(bootstrap_url: str, *, payload_url: str | None = None) -> str:
    attrs = [f'src="{escape(bootstrap_url, quote=True)}"', "data-bokeh-artifact-bootstrap"]
    if payload_url is not None:
        attrs.append(f'data-bokeh-payload-url="{escape(payload_url, quote=True)}"')
    return f"<script {' '.join(attrs)}></script>"


def _render_resources(resources: ResolvedResources, *, kind: str | None = None) -> str:
    return "\n".join(_render_resource(asset) for asset in resources.assets if kind is None or asset.kind == kind)


def _render_resource(asset: ResolvedResource) -> str:
    attributes: list[str] = []
    if asset.nonce is not None:
        attributes.append(f'nonce="{escape(asset.nonce, quote=True)}"')
    if asset.integrity is not None:
        attributes.append(f'integrity="{escape(asset.integrity, quote=True)}"')
    if asset.crossorigin is not None:
        attributes.append(f'crossorigin="{escape(asset.crossorigin, quote=True)}"')
    suffix = " " + " ".join(attributes) if attributes else ""
    if asset.kind == "script":
        script_type = ' type="module"' if asset.module else ""
        if asset.url is not None:
            return f'<script src="{escape(asset.url, quote=True)}"{script_type}{suffix}></script>'
        assert asset.content is not None
        content = asset.content.replace("</script", "<\\/script")
        return f"<script{script_type}{suffix}>{content}</script>"
    if asset.url is not None:
        return f'<link rel="stylesheet" href="{escape(asset.url, quote=True)}"{suffix}>'
    assert asset.content is not None
    return f"<style{suffix}>{asset.content}</style>"


def _html_safe_json(value: Mapping[str, Any]) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).replace(
        "&", "\\u0026",
    ).replace("<", "\\u003c").replace(">", "\\u003e").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def _build_fingerprint(artifact: EmbedArtifact, resources: ResolvedResources, renderer: str,
        options: Mapping[str, Any]) -> str:
    payload = json.dumps({
        "artifact": artifact.fingerprint,
        "resources": resources.fingerprint,
        "renderer": renderer,
        "options": options,
    }, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _validate_resource_version(artifact: EmbedArtifact, policy: ResourcePolicy) -> None:
    if policy.mode != "none" and policy.version.split("+", 1)[0] != artifact.bokeh_version.split("+", 1)[0]:
        raise ValueError(
            f"resource policy version {policy.version!r} does not match artifact Bokeh version "
            f"{artifact.bokeh_version!r}",
        )


__all__ = (
    "ArtifactFragment",
    "ArtifactMount",
    "ExternalArtifact",
    "render_external",
    "render_fragment",
    "render_mimebundle",
    "render_page",
)
