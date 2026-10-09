#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
from collections import OrderedDict
from typing import Any

# External imports
import pytest

# Bokeh imports
import bokeh.embed.standalone as bes
from bokeh.document import Document
from bokeh.models.plots import Plot
from bokeh.plotting import figure
from bokeh.util.warnings import BokehDeprecationWarning


@pytest.fixture
def test_plot() -> Plot:
    plot = figure(title="'foo'")
    plot.scatter([1, 2], [2, 3])
    return plot


def deprecated_components(*args: Any, **kwargs: Any) -> tuple[str, Any]:
    with pytest.warns(BokehDeprecationWarning, match=r"components\(\)"):
        return bes.components(*args, **kwargs)


def deprecated_file_html(*args: Any, **kwargs: Any) -> str:
    with pytest.warns(BokehDeprecationWarning, match=r"file_html\(\)"):
        return bes.file_html(*args, **kwargs)


class Test_components:
    def test_preserves_useful_return_shapes(self) -> None:
        plot1 = figure()
        plot2 = figure()

        script, div = deprecated_components(plot1)
        assert isinstance(script, str)
        assert isinstance(div, str)

        _, sequence = deprecated_components([plot1, plot2])
        assert isinstance(sequence, tuple)

        _, mapping = deprecated_components({"one": plot1, "two": plot2})
        assert list(mapping) == ["one", "two"]

        _, ordered = deprecated_components(OrderedDict((("one", plot1), ("two", plot2))))
        assert isinstance(ordered, OrderedDict)

        document = Document()
        document.add_root(plot1)
        _, document_mapping = deprecated_components({"document": document})
        assert list(document_mapping) == ["document"]

    def test_rejects_multi_root_document_mapping_with_clear_error(self) -> None:
        document = Document()
        document.add_root(figure())
        document.add_root(figure())

        with pytest.raises(ValueError, match=r"mapping value 'document'.*2 roots.*more than one div"):
            deprecated_components({"document": document})

    def test_uses_embed_declarations_and_logical_targets(self, test_plot: Plot) -> None:
        bs4 = pytest.importorskip("bs4")
        script, div = deprecated_components(test_plot)

        scripts = bs4.BeautifulSoup(script, "html.parser").find_all("script")
        assert len(scripts) == 2
        assert scripts[0]["type"] == "application/vnd.bokeh.embed+json"
        assert "mount_embed_declaration" in scripts[1].string

        [target] = bs4.BeautifulSoup(div, "html.parser").find_all("div")
        assert target["data-bokeh-root"] == "root"
        assert "data-bokeh-embed-instance" in target.attrs
        assert "data-bokeh-embed" not in target.attrs
        assert "id" not in target.attrs
        assert "data-root-id" not in target.attrs

    @pytest.mark.parametrize(("wrap_script", "wrap_plot_info"), [
        (False, True),
        (True, False),
    ])
    def test_wrapping_flags_raise_value_error(self, test_plot: Plot,
            wrap_script: bool, wrap_plot_info: bool) -> None:
        with pytest.warns(BokehDeprecationWarning, match=r"components\(\)"):
            with pytest.raises(ValueError, match=r"fragment\(resources='none'\)"):
                bes.components(test_plot, wrap_script=wrap_script, wrap_plot_info=wrap_plot_info)

class Test_file_html:
    def test_returns_embed_page_and_escapes_title(self, test_plot: Plot) -> None:
        html = deprecated_file_html(test_plot, "cdn", "&<")
        assert "<title>&amp;&lt;</title>" in html
        assert "application/vnd.bokeh.embed+json" in html
        assert "mount_embed_declaration" in html

    def test_custom_template_receives_new_and_compatibility_context(self, test_plot: Plot) -> None:
        class TemplateProbe:
            def render(self, values: dict[str, Any]) -> str:
                assert {
                    "title", "bokeh_js", "bokeh_css", "plot_script", "plot_div",
                    "embed_result", "embed_mounts", "embed_fragment", "docs", "roots", "base",
                } <= values.keys()
                assert values["custom"] == "value"
                return "template result"

        assert deprecated_file_html(
            test_plot,
            "cdn",
            template=TemplateProbe(),
            template_variables={"custom": "value"},
        ) == "template result"

    def test_custom_template_can_embed_named_roots(self, test_plot: Plot) -> None:
        test_plot.name = "named"
        html = deprecated_file_html(
            test_plot,
            "cdn",
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

        html = deprecated_file_html([plot], "cdn")
        assert "bokeh-widgets" not in html

    def test_empty_document_is_rejected(self) -> None:
        with pytest.raises(ValueError, match="no root models"):
            deprecated_file_html(Document(), "cdn")


def test_removed_item_and_autoload_contracts_raise_runtime_errors(test_plot: Plot) -> None:
    with pytest.raises(RuntimeError, match=r"embed\(model\)\.to_dict\(\)"):
        bes.json_item(test_plot)

    with pytest.raises(RuntimeError, match=r"embed\(model\)\.external"):
        bes.autoload_static(test_plot, "cdn", "/plot.json")
