#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import pytest
from jinja2 import Template, pass_context
from jinja2.runtime import Context

from bokeh.document import Document
from bokeh.embed import autoload_static, embed, json_item
from bokeh.models.plots import Plot
from bokeh.plotting import figure


@pytest.fixture
def test_plot() -> Plot:
    plot = figure(title="'foo'")
    plot.scatter([1, 2], [2, 3])
    return plot


class Test_embed_page:
    def test_returns_embed_page_and_escapes_title(self, test_plot: Plot) -> None:
        html = embed(test_plot).page(resources="cdn", title="&<")
        assert "<title>&amp;&lt;</title>" in html
        assert "application/vnd.bokeh.embed+json" in html
        assert "mount_embed_declaration" in html

    def test_custom_template_receives_new_and_compatibility_context(self, test_plot: Plot) -> None:
        @pass_context
        def check_context(context: Context) -> str:
            assert {
                "title", "bokeh_js", "bokeh_css", "plot_script", "plot_div",
                "embed_result", "embed_mounts", "embed_fragment", "docs", "roots", "base",
            } <= context.get_all().keys()
            assert context["custom"] == "value"
            return "template result"

        assert embed(test_plot).page(
            resources="cdn",
            template=Template("{{ check_context() }}"),
            template_variables={"custom": "value", "check_context": check_context},
        ) == "template result"

    def test_custom_template_can_embed_named_roots(self, test_plot: Plot) -> None:
        test_plot.name = "named"
        html = embed(test_plot).page(
            resources="cdn",
            template="{% block contents %}{{ embed(roots.named) }}{% endblock %}",
        )

        assert 'data-bokeh-root="root"' in html
        assert 'data-bokeh-embed-instance=' in html

    def test_does_not_pull_unselected_document_roots(self) -> None:
        from bokeh.models.widgets.buttons import Button

        plot = figure()
        document = Document()
        document.add_root(plot)
        document.add_root(Button())

        html = embed([plot]).page(resources="cdn")
        assert "bokeh-widgets" not in html

    def test_empty_document_is_rejected(self) -> None:
        with pytest.raises(ValueError, match="no root models"):
            embed(Document()).page(resources="cdn")


def test_removed_item_and_autoload_contracts_raise_runtime_errors(test_plot: Plot) -> None:
    with pytest.raises(RuntimeError, match=r"embed\(model\)\.to_dict\(\)"):
        json_item(test_plot)

    with pytest.raises(RuntimeError, match=r"embed\(model\)\.external"):
        autoload_static(test_plot, "cdn", "/plot.json")
