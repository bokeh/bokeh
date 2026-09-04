#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# External imports
import pytest

# Bokeh imports
import bokeh.embed.server as bes
from bokeh.embed import EmbedArtifact


def artifact_from_fragment(fragment: str) -> EmbedArtifact:
    bs4 = pytest.importorskip("bs4")
    scripts = bs4.BeautifulSoup(fragment, "html.parser").find_all("script")
    assert len(scripts) >= 2
    assert scripts[-2]["type"] == "application/vnd.bokeh.embed+json"
    assert "mount_artifact_declaration" in scripts[-1].string
    return EmbedArtifact.from_json(scripts[-2].string)


@pytest.fixture
def test_plot():
    from bokeh.plotting import figure

    plot = figure(name="selected")
    plot.scatter([1, 2], [2, 3])
    return plot


class TestServerDocument:
    def test_compiles_structured_server_source(self) -> None:
        artifact = artifact_from_fragment(bes.server_document(
            "http://localhost:8081/foo/bar/sliders",
            arguments={"b": "2", "a": "1"},
            headers={"X-Test": "yes"},
        ))
        assert artifact.source == {
            "kind": "server",
            "url": "http://localhost:8081/foo/bar/sliders",
            "arguments": {"a": "1", "b": "2"},
            "headers": {"X-Test": "yes"},
            "credentials": "same-origin",
            "relative_urls": False,
        }
        assert artifact.requires.components == (
            "bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/webgl", "bokeh/mathjax", "bokeh/api",
        )

    def test_relative_url_and_credentials_are_data_not_loader_code(self) -> None:
        fragment = bes.server_document("/bkapp", relative_urls=True, with_credentials=True)
        artifact = artifact_from_fragment(fragment)
        assert artifact.source["url"] == "/bkapp"
        assert artifact.source["relative_urls"] is True
        assert artifact.source["credentials"] == "include"
        assert "/autoload.js" not in fragment
        assert "XMLHttpRequest" not in fragment

    def test_resources_none_is_host_owned(self) -> None:
        fragment = bes.server_document(resources=None)
        assert "static/js/bokeh" not in fragment
        assert "session_id" not in artifact_from_fragment(fragment).source

    def test_rejects_invalid_resources_and_credential_headers(self) -> None:
        with pytest.raises(ValueError, match="resources"):
            bes.server_document(resources="whatever")  # type: ignore[arg-type]
        with pytest.raises(ValueError, match="mutually exclusive"):
            bes.server_document(headers={"X-Test": "yes"}, with_credentials=True)


class TestServerSession:
    def test_existing_session_and_selected_root(self, test_plot) -> None:
        artifact = artifact_from_fragment(bes.server_session(
            test_plot,
            session_id="fakesession",
            url="http://localhost:8081/app",
        ))
        assert artifact.source["session_id"] == "fakesession"
        assert artifact.roots[0].key == "selected"
        assert artifact.roots[0].model_id == test_plot.id

    def test_entire_existing_session_has_no_selected_roots(self) -> None:
        artifact = artifact_from_fragment(bes.server_session(None, session_id="fakesession"))
        assert artifact.roots == ()

    def test_session_id_is_required(self) -> None:
        with pytest.raises(ValueError, match="session_id"):
            bes.server_session(None)
