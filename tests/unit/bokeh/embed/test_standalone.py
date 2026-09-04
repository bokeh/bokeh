#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

from collections import OrderedDict
from typing import Any

import pytest

from bokeh.document import Document
from bokeh.embed import EmbedMigrationError
from bokeh.plotting import figure
from bokeh.resources import CDN

import bokeh.embed.standalone as bes


@pytest.fixture
def test_plot():
    plot = figure(title="'foo'")
    plot.scatter([1, 2], [2, 3])
    return plot


class Test_removed_envelopes:
    def test_autoload_static_has_actionable_migration(self, test_plot) -> None:
        with pytest.raises(EmbedMigrationError, match=r"embed\(model\)\.external"):
            bes.autoload_static(test_plot, CDN, "plot.json")

    def test_json_item_has_actionable_migration(self, test_plot) -> None:
        with pytest.raises(EmbedMigrationError, match=r"embed\(model\)\.to_json"):
            bes.json_item(test_plot, target="plot")


class Test_components:
    def test_preserves_useful_return_shapes(self) -> None:
        plot1 = figure()
        plot2 = figure()

        script, div = bes.components(plot1)
        assert isinstance(script, str)
        assert isinstance(div, str)

        _, sequence = bes.components([plot1, plot2])
        assert isinstance(sequence, tuple)

        _, mapping = bes.components({"one": plot1, "two": plot2})
        assert list(mapping) == ["one", "two"]

        _, ordered = bes.components(OrderedDict((("one", plot1), ("two", plot2))))
        assert isinstance(ordered, OrderedDict)

    def test_uses_artifact_declarations_and_logical_targets(self, test_plot) -> None:
        bs4 = pytest.importorskip("bs4")
        script, div = bes.components(test_plot)

        scripts = bs4.BeautifulSoup(script, "html.parser").find_all("script")
        assert len(scripts) == 2
        assert scripts[0]["type"] == "application/vnd.bokeh.embed+json"
        assert "mount_artifact_declaration" in scripts[1].string

        [target] = bs4.BeautifulSoup(div, "html.parser").find_all("div")
        assert target["data-bokeh-root"] == "root"
        assert "data-bokeh-artifact" in target.attrs
        assert "id" not in target.attrs
        assert "data-root-id" not in target.attrs

    @pytest.mark.parametrize("args, kwargs", [((False,), {}), ((), {"wrap_script": False}), ((), {"wrap_plot_info": False})])
    def test_removed_wrapping_flags_have_migration(self, test_plot, args, kwargs) -> None:
        with pytest.raises(EmbedMigrationError, match=r"fragment\(resources='none'\)"):
            bes.components(test_plot, *args, **kwargs)


class Test_file_html:
    def test_returns_artifact_page_and_escapes_title(self, test_plot) -> None:
        html = bes.file_html(test_plot, CDN, "&<")
        assert "<title>&amp;&lt;</title>" in html
        assert "application/vnd.bokeh.embed+json" in html
        assert "mount_artifact_declaration" in html

    def test_custom_template_receives_new_and_compatibility_context(self, test_plot) -> None:
        class TemplateProbe:
            def render(self, values: dict[str, Any]) -> str:
                assert {
                    "title", "bokeh_js", "bokeh_css", "plot_script", "plot_div",
                    "artifact", "artifact_mounts", "artifact_fragment", "docs", "roots", "base",
                } <= values.keys()
                assert values["custom"] == "value"
                return "template result"

        assert bes.file_html(
            test_plot,
            CDN,
            template=TemplateProbe(),  # type: ignore[arg-type]
            template_variables={"custom": "value"},
        ) == "template result"

    def test_does_not_pull_unselected_document_roots(self) -> None:
        from bokeh.models import Button

        plot = figure()
        document = Document()
        document.add_root(plot)
        document.add_root(Button())

        html = bes.file_html([plot], CDN)
        assert "bokeh-widgets" not in html

    def test_empty_document_is_rejected(self) -> None:
        with pytest.raises(ValueError, match="no root models"):
            bes.file_html(Document(), CDN)
