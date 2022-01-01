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
from os.path import dirname, join

# Bokeh imports
from bokeh._testing.util.env import envset
from bokeh.document import Document
from bokeh.embed.bundle import extension_dirs
from bokeh.ext import build
from bokeh.model import Model
from bokeh.models import Plot
from bokeh.resources import INLINE

# Module under test
import bokeh.embed.bundle as beb # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@pytest.fixture
def test_plot() -> None:
    from bokeh.plotting import figure
    test_plot = figure()
    test_plot.circle([1, 2], [2, 3])
    return test_plot

@pytest.fixture
def test_glplot() -> None:
    from bokeh.plotting import figure
    test_glplot = figure(output_backend="webgl")
    test_glplot.circle([1, 2], [2, 3])
    return test_glplot

@pytest.fixture
def test_table() -> None:
    from bokeh.models import DataTable
    test_table = DataTable()
    return test_table

@pytest.fixture
def test_widget() -> None:
    from bokeh.models import Button
    test_widget = Button()
    return test_widget

@pytest.fixture
def test_mathtext() -> None:
    from bokeh.models import TeX
    test_mathtext = TeX()
    return test_mathtext

@pytest.fixture
def test_mathstring_axis_label() -> None:
    from bokeh.models import LinearAxis
    test_mathstring = LinearAxis(axis_label = "$$sin(x)$$")
    return test_mathstring

@pytest.fixture
def test_mathstring_axis_label_with_parenthesis() -> None:
    from bokeh.models import LinearAxis
    test_mathstring = LinearAxis(axis_label = r"\(sin(x)\)")
    return test_mathstring

@pytest.fixture
def test_mathstring_major_label_overrides() -> None:
    from bokeh.models import LinearAxis
    test_mathstring = LinearAxis(major_label_overrides = {0: r"\[sin(x)\]"})
    return test_mathstring

@pytest.fixture
def test_plaintext() -> None:
    from bokeh.models import PlainText
    test_plaintext = PlainText("$$sin(x)$$")
    return test_plaintext

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class Test_bundle_for_objs_and_resources:
    def test_env_vars_precedence(self) -> None:
        b = beb.bundle_for_objs_and_resources([], INLINE)
        assert all('localhost' not in x for x in b.js_files)

        # this is a cheap test that a BokehJS file is inline
        assert any(len(x) > 5000 for x in b.js_raw)

        with envset(BOKEH_RESOURCES="server-dev"):
            b = beb.bundle_for_objs_and_resources([], INLINE)
        assert any('localhost' in x for x in b.js_files)

        # this is a cheap test that a BokehJS file is NOT inline
        assert all(len(x) < 5000 for x in b.js_raw)

        with envset(BOKEH_RESOURCES="cdn"):
            b = beb.bundle_for_objs_and_resources([], INLINE)
        assert any('cdn' in x for x in b.js_files)

        # this is a cheap test that a BokehJS file is NOT inline
        assert all(len(x) < 5000 for x in b.js_raw)

class Test_bundle_custom_extensions:

    @classmethod
    def setup_class(cls):
        base_dir = dirname(__file__)
        build(join(base_dir, "latex_label"), rebuild=True)

    @classmethod
    def teardown_class(cls):
        del Model.model_class_reverse_map["latex_label.LatexLabel"]
        extension_dirs.clear()

    def test_with_INLINE_resources(self) -> None:
        from latex_label import LatexLabel
        plot = Plot()
        plot.add_layout(LatexLabel())
        bundle = beb.bundle_for_objs_and_resources([plot], "inline")
        assert len(bundle.js_raw) == 3
        assert "class LatexLabelView" in bundle.js_raw[2]

    def test_with_CDN_resources(self) -> None:
        from latex_label import LatexLabel
        plot = Plot()
        plot.add_layout(LatexLabel())
        bundle = beb.bundle_for_objs_and_resources([plot], "cdn")
        assert len(bundle.js_files) == 2
        assert bundle.js_files[1] == "https://unpkg.com/latex_label@0.0.1/dist/latex_label.js"

    def test_with_Server_resources(self) -> None:
        from latex_label import LatexLabel
        plot = Plot()
        plot.add_layout(LatexLabel())
        bundle = beb.bundle_for_objs_and_resources([plot], "server")
        version_hash = "6b13789e43e5485634533de16a65d8ba9d34c4c9758588b665805435f80eb115"
        assert len(bundle.js_files) == 2
        assert (bundle.js_files[1] ==
                f"http://localhost:5006/static/extensions/latex_label/latex_label.js?v={version_hash}")

    def test_with_Server_resources_dev(self) -> None:
        from latex_label import LatexLabel
        plot = Plot()
        plot.add_layout(LatexLabel())
        with envset(BOKEH_RESOURCES="server", BOKEH_DEV="true"):
            bundle = beb.bundle_for_objs_and_resources([plot], "server")
        assert len(bundle.js_files) == 2
        assert bundle.js_files[1] == "http://localhost:5006/static/extensions/latex_label/latex_label.js"

class Test_bundle_ext_package_no_main:

    @classmethod
    def setup_class(cls):
        base_dir = dirname(__file__)
        build(join(base_dir, "ext_package_no_main"), rebuild=True)

    @classmethod
    def teardown_class(cls):
        del Model.model_class_reverse_map["ext_package_no_main.AModel"]
        extension_dirs.clear()

    def test_with_INLINE_resources(self) -> None:
        from ext_package_no_main import AModel
        model = AModel()
        bundle = beb.bundle_for_objs_and_resources([model], "inline")
        assert len(bundle.js_files) == 0
        assert len(bundle.js_raw) == 3

    def test_with_CDN_resources(self) -> None:
        from ext_package_no_main import AModel
        model = AModel()
        bundle = beb.bundle_for_objs_and_resources([model], "cdn")
        assert len(bundle.js_files) == 1
        assert len(bundle.js_raw) == 2

    def test_with_Server_resources(self) -> None:
        from ext_package_no_main import AModel
        model = AModel()
        bundle = beb.bundle_for_objs_and_resources([model], "server")
        assert len(bundle.js_files) == 2
        assert len(bundle.js_raw) == 1

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------


class Test__any:
    def test_with_models(self, test_plot, test_table) -> None:
        from bokeh.models import Button
        assert beb._any([test_plot, test_table], lambda x: isinstance(x, object)) is True
        assert beb._any([test_plot, test_table], lambda x: isinstance(x, Button)) is False

    def test_with_doc(self, test_plot, test_table) -> None:
        from bokeh.models import Button
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        assert beb._any([d], lambda x: isinstance(x, object)) is True
        assert beb._any([d], lambda x: isinstance(x, Button)) is False


class Test__use_gl:
    def test_without_gl(self, test_plot, test_glplot, test_table, test_widget) -> None:
        assert beb._use_gl([test_plot]) is False
        assert beb._use_gl([test_plot, test_table]) is False
        assert beb._use_gl([test_plot, test_widget]) is False
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        assert beb._use_gl([d]) is False

    def test_with_gl(self, test_plot, test_glplot, test_table, test_widget) -> None:
        assert beb._use_gl([test_glplot]) is True
        assert beb._use_gl([test_plot, test_glplot]) is True
        assert beb._use_gl([test_plot, test_widget, test_glplot]) is True
        assert beb._use_gl([test_plot, test_widget, test_table, test_glplot]) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_glplot)
        assert beb._use_gl([d]) is True


class Test__use_tables:
    def test_without_tables(self, test_plot, test_glplot, test_table, test_widget) -> None:
        assert beb._use_tables([test_plot]) is False
        assert beb._use_tables([test_plot, test_glplot]) is False
        assert beb._use_tables([test_plot, test_widget]) is False
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_glplot)
        d.add_root(test_widget)
        assert beb._use_tables([d]) is False

    def test_with_tables(self, test_plot, test_glplot, test_table, test_widget) -> None:
        assert beb._use_tables([test_table]) is True
        assert beb._use_tables([test_table, test_plot]) is True
        assert beb._use_tables([test_table, test_plot, test_glplot]) is True
        assert beb._use_tables([test_table, test_widget, test_table, test_glplot]) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_glplot)
        assert beb._use_tables([d]) is True


class Test__use_widgets:
    def test_without_widgets(self, test_plot, test_glplot, test_table, test_widget) -> None:
        assert beb._use_widgets([test_plot]) is False
        assert beb._use_widgets([test_plot, test_glplot]) is False
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_glplot)
        assert beb._use_widgets([d]) is False

    def test_with_widgets(self, test_plot, test_glplot, test_table, test_widget) -> None:
        assert beb._use_widgets([test_widget]) is True
        assert beb._use_widgets([test_widget, test_plot]) is True
        assert beb._use_widgets([test_widget, test_plot, test_glplot]) is True
        assert beb._use_widgets([test_widget, test_plot, test_glplot, test_table]) is True
        assert beb._use_widgets([test_table, test_table, test_glplot]) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_glplot)
        assert beb._use_widgets([d]) is True


class Test__use_mathjax:
    def test_without_mathjax(self, test_plot, test_glplot, test_table, test_widget, test_mathtext) -> None:
        assert beb._use_mathjax([test_plot]) is False
        assert beb._use_mathjax([test_plot, test_glplot]) is False
        assert beb._use_mathjax([test_plot, test_table]) is False
        assert beb._use_mathjax([test_plot, test_widget]) is False
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        assert beb._use_mathjax([d]) is False

    def test_with_mathjax(self, test_plot, test_glplot, test_table, test_widget, test_mathtext, test_plaintext) -> None:
        assert beb._use_mathjax([test_mathtext]) is True
        assert beb._use_mathjax([test_plot, test_mathtext]) is True
        assert beb._use_mathjax([test_plot, test_glplot, test_mathtext]) is True
        assert beb._use_mathjax([test_plot, test_widget, test_mathtext]) is True
        assert beb._use_mathjax([test_plot, test_widget, test_table, test_mathtext]) is True
        assert beb._use_mathjax([test_plot, test_plaintext, test_mathtext]) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_mathtext)
        assert beb._use_mathjax([d]) is True

    def test_with_mathstring(self, test_plot, test_glplot, test_table, test_widget, test_mathtext,
            test_mathstring_axis_label, test_mathstring_major_label_overrides) -> None:
        assert beb._use_mathjax([test_mathstring_axis_label]) is True
        assert beb._use_mathjax([test_plot, test_mathstring_axis_label]) is True
        assert beb._use_mathjax([test_plot, test_glplot, test_mathstring_axis_label]) is True
        assert beb._use_mathjax([test_plot, test_widget, test_mathstring_axis_label]) is True
        assert beb._use_mathjax([test_plot, test_widget, test_table, test_mathstring_axis_label]) is True
        assert beb._use_mathjax([test_plot, test_mathtext, test_mathstring_axis_label]) is True
        assert beb._use_mathjax([test_plot, test_mathstring_major_label_overrides]) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_mathstring_axis_label)
        assert beb._use_mathjax([d]) is True

    def test_with_plaintext(self, test_plot, test_glplot, test_table, test_widget, test_mathtext, test_plaintext) -> None:
        assert beb._use_mathjax([test_plaintext]) is False
        assert beb._use_mathjax([test_plot, test_plaintext]) is False
        assert beb._use_mathjax([test_plot, test_glplot, test_plaintext]) is False
        assert beb._use_mathjax([test_plot, test_widget, test_plaintext]) is False
        assert beb._use_mathjax([test_plot, test_widget, test_table, test_plaintext]) is False
        assert beb._use_mathjax([test_plot, test_mathtext, test_plaintext]) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_plaintext)
        assert beb._use_mathjax([d]) is False
#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
