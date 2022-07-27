#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
from collections import OrderedDict
from copy import deepcopy
from typing import Any

# External imports
import bs4
import numpy as np
from jinja2 import Template
from mock import MagicMock, patch
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver

# Bokeh imports
import bokeh.resources as resources
import bokeh.util.version as buv
from bokeh.core.types import ID
from bokeh.document import Document
from bokeh.embed.util import RenderRoot, standalone_docs_json
from bokeh.io import curdoc
from bokeh.plotting import figure
from bokeh.resources import CDN, CSSResources, JSResources
from bokeh.themes import Theme

# Module under test
import bokeh.embed.standalone as bes # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
    "bokeh._testing.plugins.selenium",
)

def stable_id() -> ID:
    return ID('ID')

@pytest.fixture
def test_plot() -> figure:
    from bokeh.plotting import figure
    test_plot = figure(title="'foo'")
    test_plot.circle(np.array([1, 2]), np.array([2, 3]))
    return test_plot

PAGE = Template("""
<!DOCTYPE html>
<html lang="en">
<head>
</head>

<body>
  <script>
  {{js}}
  </script>
  {{tag}}
</body>
""")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_autoload_static:
    def test_return_type(self, test_plot: figure) -> None:
        r = bes.autoload_static(test_plot, CDN, "some/path")
        assert len(r) == 2

    def test_script_attrs(self, test_plot: figure) -> None:
        _, tag = bes.autoload_static(test_plot, CDN, "some/path")
        html = bs4.BeautifulSoup(tag, "html.parser")
        scripts = html.find_all(name='script')
        assert len(scripts) == 1
        attrs = scripts[0].attrs
        assert set(attrs) == {"src", "id"}
        assert attrs["src"] == "some/path"

    @pytest.mark.parametrize("version", ["1.4.0rc1", "2.0.0dev3"])
    @pytest.mark.selenium
    def test_js_dev_cdn(self, version: str, monkeypatch: pytest.MonkeyPatch, driver: WebDriver,
            test_file_path_and_url: tuple[str, str], test_plot: figure) -> None:
        monkeypatch.setattr(buv, "__version__", "1.4.0rc1")
        monkeypatch.setattr(resources, "__version__", "1.4.0rc1")
        js, tag = bes.autoload_static(test_plot, CDN, "some/path")

        page = PAGE.render(js=js, tag=tag)

        path, url = test_file_path_and_url
        with open(path, "w") as f:
            f.write(page)

        driver.get(url)

        scripts = driver.find_elements(By.CSS_SELECTOR, 'head script')
        assert len(scripts) == 5
        for script in scripts:
            assert script.get_attribute("crossorigin") is None
            assert script.get_attribute("integrity") == ""

    @pytest.mark.selenium
    def test_js_release_cdn(self, monkeypatch: pytest.MonkeyPatch, driver: WebDriver,
            test_file_path_and_url: tuple[str, str], test_plot: figure) -> None:
        monkeypatch.setattr(buv, "__version__", "2.0.0")
        monkeypatch.setattr(resources, "__version__", "2.0.0")
        r = deepcopy(CDN)
        # Skip bokeh-mathjax for older versions
        r.js_components.remove("bokeh-mathjax")
        js, tag = bes.autoload_static(test_plot, r, "some/path")

        page = PAGE.render(js=js, tag=tag)

        path, url = test_file_path_and_url
        with open(path, "w") as f:
            f.write(page)

        driver.get(url)

        scripts = driver.find_elements(By.CSS_SELECTOR, 'head script')
        for x in scripts:
            print(x.get_attribute("src"))
        assert len(scripts) == 4
        for script in scripts:
            assert script.get_attribute("crossorigin") is None
            assert script.get_attribute("integrity") == ""

    @pytest.mark.selenium
    def test_js_release_dev_cdn(self, monkeypatch: pytest.MonkeyPatch, driver: WebDriver,
            test_file_path_and_url: tuple[str, str], test_plot: figure) -> None:
        monkeypatch.setattr(buv, "__version__", "2.0.0-foo")
        monkeypatch.setattr(resources, "__version__", "2.0.0-foo")
        js, tag = bes.autoload_static(test_plot, CDN, "some/path")

        page = PAGE.render(js=js, tag=tag)

        path, url = test_file_path_and_url
        with open(path, "w") as f:
            f.write(page)

        driver.get(url)

        scripts = driver.find_elements(By.CSS_SELECTOR, 'head script')
        for x in scripts:
            print(x.get_attribute("src"))
        assert len(scripts) == 5
        for script in scripts:
            assert script.get_attribute("crossorigin") is None
            assert script.get_attribute("integrity") == ""

    @pytest.mark.selenium
    def test_js_release_server(self, monkeypatch: pytest.MonkeyPatch, driver: WebDriver,
            test_file_path_and_url: tuple[str, str], test_plot: figure) -> None:
        monkeypatch.setattr(buv, "__version__", "2.0.0")
        monkeypatch.setattr(resources, "__version__", "2.0.0")
        js, tag = bes.autoload_static(test_plot, resources.Resources(mode="server"), "some/path")

        page = PAGE.render(js=js, tag=tag)

        path, url = test_file_path_and_url
        with open(path, "w") as f:
            f.write(page)

        driver.get(url)

        scripts = driver.find_elements(By.CSS_SELECTOR, 'head script')
        assert len(scripts) == 5
        for script in scripts:
            assert script.get_attribute("crossorigin") is None
            assert script.get_attribute("integrity") == ""


class Test_components:
    def test_return_type(self) -> None:
        plot1 = figure()
        plot1.circle([], [])
        plot2 = figure()
        plot2.circle([], [])
        # This is a testing artefact, users don't have to do this in practice
        curdoc().add_root(plot1)
        curdoc().add_root(plot2)

        r = bes.components(plot1)
        assert len(r) == 2

        _, divs0 = bes.components((plot1, plot2))
        assert isinstance(divs0, tuple)

        _, divs1 = bes.components([plot1, plot2])
        assert isinstance(divs1, tuple)

        _, divs2 = bes.components({"Plot 1": plot1, "Plot 2": plot2})
        assert isinstance(divs2, dict)
        assert all(isinstance(x, str) for x in divs2.keys())

        # explict test for OrderedDict (don't replace with dict)
        _, divs3 = bes.components(OrderedDict([("Plot 1", plot1), ("Plot 2", plot2)]))
        assert isinstance(divs3, OrderedDict)
        assert all(isinstance(x, str) for x in divs3.keys())

    @patch('bokeh.embed.util.make_globally_unique_id', new_callable=lambda: stable_id)
    def test_plot_dict_returned_when_wrap_plot_info_is_false(self, mock_make_id: MagicMock) -> None:
        doc = Document()
        plot1 = figure()
        plot1.circle([], [])
        doc.add_root(plot1)

        plot2 = figure()
        plot2.circle([], [])
        doc.add_root(plot2)

        expected_plotdict_1 = RenderRoot(elementid=ID("ID"), id=ID("ID"))
        expected_plotdict_2 = RenderRoot(elementid=ID("ID"), id=ID("ID"))

        _, plotdict = bes.components(plot1, wrap_plot_info=False)
        assert plotdict == expected_plotdict_1

        _, plotids = bes.components((plot1, plot2), wrap_plot_info=False)
        assert plotids == (expected_plotdict_1, expected_plotdict_2)

        _, plotiddict = bes.components({'p1': plot1, 'p2': plot2}, wrap_plot_info=False)
        assert plotiddict == {'p1': expected_plotdict_1, 'p2': expected_plotdict_2}

    def test_result_attrs(self, test_plot: figure) -> None:
        script, _ = bes.components(test_plot)
        html = bs4.BeautifulSoup(script, "html.parser")
        scripts = html.find_all(name='script')
        assert len(scripts) == 1
        assert scripts[0].attrs == {'type': 'text/javascript'}

    @patch('bokeh.embed.util.make_globally_unique_id', new=stable_id)
    def test_div_attrs(self, test_plot: figure) -> None:
        _, div = bes.components(test_plot)
        html = bs4.BeautifulSoup(div, "html.parser")

        els = html.find_all(name='div')
        assert len(els) == 1

        el = els[0]
        assert set(el.attrs) == {"class", "id", "data-root-id"}
        assert el.attrs["class"] == ["bk-root"]
        assert el.attrs["id"] == "ID"
        assert el.attrs["data-root-id"] == test_plot.id
        assert el.string is None

    def test_script_is_utf8_encoded(self, test_plot: figure) -> None:
        script, _ = bes.components(test_plot)
        assert isinstance(script, str)

    def test_quoting(self, test_plot: figure) -> None:
        script, _ = bes.components(test_plot)
        assert "&quot;" not in script
        assert "'foo'" not in script
        assert "&#x27;foo&#x27;" in script

    def test_output_is_without_script_tag_when_wrap_script_is_false(self, test_plot: figure) -> None:
        script, _ = bes.components(test_plot)
        html = bs4.BeautifulSoup(script, "html.parser")
        scripts = html.find_all(name='script')
        assert len(scripts) == 1

        # XXX: this needs to account for indentation
        #script_content = scripts[0].getText()

        #rawscript, div = bes.components(test_plot, wrap_script=False)
        #self.maxDiff = None
        #assert rawscript.strip() == script_content.strip()


class Test_file_html:
    def test_return_type(self, test_plot: figure) -> None:

        class fake_template:
            def __init__(self, tester: Any, user_template_variables: set[str] | None = None) -> None:
                self.tester = tester
                self.template_variables = {
                    "title",
                    "bokeh_js",
                    "bokeh_css",
                    "plot_script",
                    "doc",
                    "docs",
                    "base",
                }
                if user_template_variables is not None:
                    self.template_variables.update(user_template_variables)

            def render(self, template_variables: dict[str, Any]) -> str:
                assert self.template_variables.issubset(set(template_variables.keys()))
                return "template result"

        r = bes.file_html(test_plot, CDN, "title")
        assert isinstance(r, str)

        r = bes.file_html(test_plot, CDN, "title",
                          template=fake_template(self)) # type: ignore[arg-type]
        assert isinstance(r, str)

        r = bes.file_html(test_plot, CDN, "title",
                          template=fake_template(self, {"test_var"}), # type: ignore[arg-type]
                          template_variables={"test_var": "test"})
        assert isinstance(r, str)

    @patch('bokeh.embed.bundle.warn')
    def test_file_html_handles_js_only_resources(self, mock_warn: MagicMock, test_plot: figure) -> None:
        js_resources = JSResources(mode="relative", components=["bokeh"])
        template = Template("<head>{{ bokeh_js }}</head><body></body>")
        output = bes.file_html(test_plot, (js_resources, None), "title", template=template)
        html = "<head>%s</head><body></body>" % js_resources.render_js()
        assert output == html

    @patch('bokeh.embed.bundle.warn')
    def test_file_html_provides_warning_if_no_css(self, mock_warn: MagicMock, test_plot: figure) -> None:
        js_resources = JSResources()
        bes.file_html(test_plot, (js_resources, None), "title")
        mock_warn.assert_called_once_with(
            'No Bokeh CSS Resources provided to template. If required you will need to provide them manually.'
        )

    @patch('bokeh.embed.bundle.warn')
    def test_file_html_handles_css_only_resources(self, mock_warn: MagicMock, test_plot: figure) -> None:
        css_resources = CSSResources(mode="relative", components=["bokeh"])
        template = Template("<head>{{ bokeh_css }}</head><body></body>")
        output = bes.file_html(test_plot, (None, css_resources), "title", template=template)
        html = "<head>%s</head><body></body>" % css_resources.render_css()
        assert output == html

    @patch('bokeh.embed.bundle.warn')
    def test_file_html_provides_warning_if_no_js(self, mock_warn: MagicMock, test_plot: figure) -> None:
        css_resources = CSSResources()
        bes.file_html(test_plot, (None, css_resources), "title")
        mock_warn.assert_called_once_with(
            'No Bokeh JS Resources provided to template. If required you will need to provide them manually.'
        )

    def test_file_html_title_is_escaped(self, test_plot: figure) -> None:
        r = bes.file_html(test_plot, CDN, "&<")
        assert "<title>&amp;&lt;</title>" in r

    def test_entire_doc_is_not_used(self) -> None:
        from bokeh.document import Document
        from bokeh.models import Button

        fig = figure()
        fig.x([0], [0])

        button = Button(label="Button")

        d = Document()
        d.add_root(fig)
        d.add_root(button)
        out = bes.file_html([fig], CDN)

        # this is a very coarse test but it will do
        assert "bokeh-widgets" not in out

JSON_ITEMS_KEYS = {"target_id", "root_id", "doc", "version"}

class Test_json_item:
    def test_with_target_id(self, test_plot: figure) -> None:
        out = bes.json_item(test_plot, target=ID("foo"))
        assert set(out.keys()) == JSON_ITEMS_KEYS
        assert out['target_id'] == "foo"

    def test_without_target_id(self, test_plot: figure) -> None:
        out = bes.json_item(test_plot)
        assert set(out.keys()) == JSON_ITEMS_KEYS
        assert out['target_id'] is None

    def test_doc_json(self, test_plot: figure) -> None:
        out = bes.json_item(test_plot, target=ID("foo"))
        assert set(out.keys()) == JSON_ITEMS_KEYS
        expected = list(standalone_docs_json([test_plot]).values())[0]
        assert out['doc'] == expected

    def test_doc_title(self, test_plot: figure) -> None:
        out = bes.json_item(test_plot, target=ID("foo"))
        assert set(out.keys()) == JSON_ITEMS_KEYS
        assert out['doc']['title'] == ""

    def test_root_id(self, test_plot: figure) -> None:
        out = bes.json_item(test_plot, target=ID("foo"))
        assert set(out.keys()) == JSON_ITEMS_KEYS
        assert out['doc']['roots'][0]["id"] == out['root_id']

    def test_version(self, monkeypatch: pytest.MonkeyPatch, test_plot: figure) -> None:
        from bokeh import __version__

        out = bes.json_item(test_plot, target=ID("foo"))
        assert set(out.keys()) == JSON_ITEMS_KEYS
        assert out['doc']['version'] == __version__

        out = bes.json_item(test_plot)
        assert set(out.keys()) == JSON_ITEMS_KEYS
        assert out['doc']['version'] == __version__

    def test_json_dumps(self, test_plot: figure) -> None:
        doc_json = bes.json_item(test_plot)
        assert isinstance(json.dumps(doc_json), str)

    @patch('bokeh.embed.standalone.OutputDocumentFor')
    def test_apply_theme(self, mock_OFD: MagicMock, test_plot: figure) -> None:
        # the subsequent call inside ODF will fail since the model was never
        # added to a document. Ignoring that since we just want to make sure
        # ODF is called with the expected theme arg.
        theme = Theme(json={})
        try:
            bes.json_item(test_plot, theme=theme)
        except ValueError:
            pass
        mock_OFD.assert_called_once_with([test_plot], apply_theme=theme)


#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class Test__title_from_models:
    pass

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
