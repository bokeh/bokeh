from __future__ import annotations

# Bokeh imports
from bokeh.embed.artifact import EMBED_ARTIFACT_SCHEMA
from bokeh.embed.notebook import notebook_content
from bokeh.plotting import figure


def test_notebook_content_is_a_common_artifact_fragment() -> None:
    plot = figure(width=300, height=200)
    artifact, fragment = notebook_content(plot)

    assert artifact.schema == EMBED_ARTIFACT_SCHEMA
    assert artifact.source["kind"] == "standalone"
    assert fragment.artifact is artifact
    assert fragment.resources.policy.mode == "none"
    assert fragment.html.count("data-bokeh-artifact-payload") == 1
    assert "embed_items_notebook" not in fragment.html
    assert "docs_json" not in fragment.html


def test_live_notebook_content_uses_protocol_full_ids() -> None:
    plot = figure(width=300, height=200)
    artifact, _ = notebook_content(plot, live=True)

    compiler = artifact.metadata["compiler"]
    assert compiler["model_ids"] == "protocol-full"
    assert compiler["static_model_ids"] == "protocol-full"
    assert artifact.roots[0].key == "root"
    assert artifact.source["documents"][0]["roots"][0]["id"] == plot.id


def test_static_and_live_artifacts_share_requirements() -> None:
    plot = figure()
    static, _ = notebook_content(plot)
    live, _ = notebook_content(plot, live=True)

    assert static.requires == live.requires
    assert static.fingerprint != live.fingerprint
