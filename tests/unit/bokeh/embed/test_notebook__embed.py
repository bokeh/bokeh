from __future__ import annotations

# Bokeh imports
from bokeh.embed.notebook import notebook_content
from bokeh.embed.result import EMBED_SCHEMA
from bokeh.plotting import figure


def test_notebook_content_is_a_common_embed_fragment() -> None:
    plot = figure(width=300, height=200)
    result, fragment = notebook_content(plot)

    assert result.schema == EMBED_SCHEMA
    assert result.source["kind"] == "standalone"
    assert fragment.result is result
    assert fragment.resources.policy.mode == "none"
    assert fragment.html.count("data-bokeh-embed-payload") == 1
    assert "embed_items_notebook" not in fragment.html
    assert "docs_json" not in fragment.html


def test_live_notebook_content_uses_protocol_full_ids() -> None:
    plot = figure(width=300, height=200)
    result, _ = notebook_content(plot, live=True)

    embedding = result.metadata["embedding"]
    assert embedding["model_ids"] == "protocol-full"
    assert "static_model_ids" not in embedding
    assert result.roots[0].key == "root"
    assert result.source["documents"][0]["roots"][0]["id"] == plot.id


def test_static_and_live_results_share_requirements() -> None:
    plot = figure()
    static, _ = notebook_content(plot)
    live, _ = notebook_content(plot, live=True)

    assert static.requires == live.requires
    assert static.roots == live.roots
    assert static.metadata["embedding"]["model_ids"] == "graph-minimal"
    assert live.metadata["embedding"]["model_ids"] == "protocol-full"
    assert static.source != live.source
    assert live.source["documents"][0]["roots"][0]["id"] == plot.id
