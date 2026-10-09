#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
from types import SimpleNamespace
from typing import Any

# External imports
import pytest

# Bokeh imports
import bokeh.embed.server as bes
from bokeh.document import Document
from bokeh.embed import EmbedResult
from bokeh.embed._util import server_page_for_session
from bokeh.embed.resources import ResourceRequirements
from bokeh.model import Model
from bokeh.models import CustomJS
from bokeh.resources import Resources
from bokeh.util.compiler import JavaScript
from bokeh.util.warnings import BokehDeprecationWarning


def result_from_fragment(fragment: str) -> EmbedResult:
    bs4 = pytest.importorskip("bs4")
    scripts = bs4.BeautifulSoup(fragment, "html.parser").find_all("script")
    assert len(scripts) >= 2
    assert scripts[-2]["type"] == "application/vnd.bokeh.embed+json"
    assert "mount_embed_declaration" in scripts[-1].string
    return EmbedResult.from_json(scripts[-2].string)


def deprecated_server_document(*args: Any, **kwargs: Any) -> str:
    with pytest.warns(BokehDeprecationWarning, match=r"server_document\(\)"):
        return bes.server_document(*args, **kwargs)


def deprecated_server_session(*args: Any, **kwargs: Any) -> str:
    with pytest.warns(BokehDeprecationWarning, match=r"server_session\(\)"):
        return bes.server_session(*args, **kwargs)


@pytest.fixture
def test_plot():
    from bokeh.plotting import figure

    plot = figure(name="selected")
    plot.scatter([1, 2], [2, 3])
    return plot


class TestServerDocument:
    def test_builds_structured_server_source(self) -> None:
        result = result_from_fragment(deprecated_server_document(
            "http://localhost:8081/foo/bar/sliders",
            arguments={"b": "2", "a": "1"},
            headers={"X-Test": "yes"},
        ))
        assert result.source == {
            "kind": "server",
            "url": "http://localhost:8081/foo/bar/sliders",
            "arguments": {"a": "1", "b": "2"},
            "headers": {"X-Test": "yes"},
            "credentials": "same-origin",
            "relative_urls": False,
        }
        assert result.requires.components == (
            "bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/webgl", "bokeh/mathjax",
        )

    def test_relative_url_and_credentials_are_data_not_loader_code(self) -> None:
        fragment = deprecated_server_document("/bkapp", relative_urls=True, with_credentials=True)
        result = result_from_fragment(fragment)
        assert result.source["url"] == "/bkapp"
        assert result.source["relative_urls"] is True
        assert result.source["credentials"] == "include"
        assert "/autoload.js" not in fragment
        assert "XMLHttpRequest" not in fragment

    def test_resources_none_is_host_owned(self) -> None:
        fragment = deprecated_server_document(resources=None)
        assert "static/js/bokeh" not in fragment
        assert "session_id" not in result_from_fragment(fragment).source

    def test_rejects_invalid_resources(self) -> None:
        with pytest.raises(ValueError, match="resources"):
            deprecated_server_document(resources="whatever")  # type: ignore[arg-type]

    def test_headers_and_credentials_can_be_combined(self) -> None:
        result = result_from_fragment(deprecated_server_document(
            headers={"Authorization": "Bearer token"}, with_credentials=True,
        ))
        assert result.source["headers"] == {"Authorization": "Bearer token"}
        assert result.source["credentials"] == "include"

    def test_legacy_arguments_are_converted_to_strings(self) -> None:
        result = result_from_fragment(deprecated_server_document(arguments={"n": 5, "user": None}))

        assert result.source["arguments"] == {"n": "5", "user": "None"}


class TestServerSession:
    def test_existing_session_and_selected_root(self, test_plot) -> None:
        result = result_from_fragment(deprecated_server_session(
            test_plot,
            session_id="fakesession",
            url="http://localhost:8081/app",
        ))
        assert result.source["session_id"] == "fakesession"
        assert result.roots[0].key == "selected"
        assert result.roots[0].model_id == test_plot.id

    def test_entire_existing_session_has_no_selected_roots(self) -> None:
        result = result_from_fragment(deprecated_server_session(None, session_id="fakesession"))
        assert result.roots == ()

    def test_full_page_template_can_embed_named_session_roots(self, test_plot) -> None:
        document = Document()
        document.add_root(test_plot)
        session = SimpleNamespace(document=document, token="faketoken")

        html = server_page_for_session(
            session, Resources(mode="cdn"), "title",
            template="{% block contents %}{{ embed(roots.selected) }}{% endblock %}",  # type: ignore[arg-type]
        )

        assert 'data-bokeh-root="selected"' in html
        assert 'data-bokeh-embed=' in html
        result = result_from_fragment(html)
        assert result.metadata["embedding"]["full_document"] is True
        assert result.roots[0].key == "selected"

    def test_full_page_delegates_registered_extensions_to_token_bootstrap(
        self, monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        class InlineCustomJS(CustomJS):
            __implementation__ = JavaScript("export const value = 1")

        def fail_if_compiled(_models):
            raise AssertionError("direct pages must obtain extension resources from /embed.json")

        monkeypatch.setattr("bokeh.embed.resources.bundle_models", fail_if_compiled)
        document = Document()
        session = SimpleNamespace(document=document, token="faketoken")

        try:
            result = result_from_fragment(server_page_for_session(
                session, Resources(mode="none"), "title",
            ))
        finally:
            Model.clear_extensions()

        assert result.source["token"] == "faketoken"
        assert result.requires == ResourceRequirements.dynamic_server()
        assert result.requires.extensions == ()

    def test_session_id_is_required(self) -> None:
        with pytest.raises(ValueError, match="session_id"):
            deprecated_server_session(None)
