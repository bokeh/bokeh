#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from bokeh.core.has_props import _default_resolver
from bokeh.document import Document
from bokeh.embed.bundle import extension_dirs
from bokeh.ext import build
from bokeh.models import Plot
from bokeh.resources import CDN, INLINE, Resources
from tests.support.util.env import envset

# Module under test
import bokeh.embed.bundle as beb # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ABSOLUTE = Resources(mode="absolute")
SERVER = Resources(mode="server")

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

    def test_no_objs_all_resources_bundled(self) -> None:
        b = beb.bundle_for_objs_and_resources(None, ABSOLUTE)
        assert any('bokeh-widgets' in f for f in b.js_files)
        assert any('bokeh-gl' in f for f in b.js_files)
        assert any('bokeh-tables' in f for f in b.js_files)
        assert any('bokeh-mathjax' in f for f in b.js_files)

class Test_bundle_custom_extensions:

    @classmethod
    def setup_class(cls):
        base_dir = dirname(__file__)
        build(join(base_dir, "latex_label"), rebuild=True)

    @classmethod
    def teardown_class(cls):
        from latex_label import LatexLabel
        _default_resolver.remove(LatexLabel)
        extension_dirs.clear()

    def test_with_INLINE_resources(self) -> None:
        from latex_label import LatexLabel
        plot = Plot()
        plot.add_layout(LatexLabel())
        bundle = beb.bundle_for_objs_and_resources([plot], INLINE)
        assert len(bundle.js_raw) == 3
        assert "class LatexLabelView" in bundle.js_raw[2]

    def test_with_CDN_resources(self) -> None:
        from latex_label import LatexLabel
        plot = Plot()
        plot.add_layout(LatexLabel())
        bundle = beb.bundle_for_objs_and_resources([plot], CDN)
        assert len(bundle.js_files) == 2
        assert bundle.js_files[1] == "https://unpkg.com/latex_label@0.0.1/dist/latex_label.js"

    def test_with_Server_resources(self) -> None:
        from latex_label import LatexLabel
        plot = Plot()
        plot.add_layout(LatexLabel())
        bundle = beb.bundle_for_objs_and_resources([plot], SERVER)
        version_hash = "6b13789e43e5485634533de16a65d8ba9d34c4c9758588b665805435f80eb115"
        assert len(bundle.js_files) == 2
        assert (bundle.js_files[1] ==
                f"http://localhost:5006/static/extensions/latex_label/latex_label.js?v={version_hash}")

    def test_with_Server_resources_dev(self) -> None:
        from latex_label import LatexLabel
        plot = Plot()
        plot.add_layout(LatexLabel())
        with envset(BOKEH_RESOURCES="server", BOKEH_DEV="true"):
            bundle = beb.bundle_for_objs_and_resources([plot], SERVER)
        assert len(bundle.js_files) == 2
        assert bundle.js_files[1] == "http://localhost:5006/static/extensions/latex_label/latex_label.js"

class Test_bundle_ext_package_no_main:

    @classmethod
    def setup_class(cls):
        base_dir = dirname(__file__)
        build(join(base_dir, "ext_package_no_main"), rebuild=True)

    @classmethod
    def teardown_class(cls):
        from ext_package_no_main import AModel
        _default_resolver.remove(AModel)
        extension_dirs.clear()

    def test_with_INLINE_resources(self) -> None:
        from ext_package_no_main import AModel
        model = AModel()
        bundle = beb.bundle_for_objs_and_resources([model], INLINE)
        assert len(bundle.js_files) == 0
        assert len(bundle.js_raw) == 3

    def test_with_CDN_resources(self) -> None:
        from ext_package_no_main import AModel
        model = AModel()
        bundle = beb.bundle_for_objs_and_resources([model], CDN)
        assert len(bundle.js_files) == 1
        assert len(bundle.js_raw) == 2

    def test_with_Server_resources(self) -> None:
        from ext_package_no_main import AModel
        model = AModel()
        bundle = beb.bundle_for_objs_and_resources([model], SERVER)
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
        assert beb._use_gl(beb._all_objs([test_plot])) is False
        assert beb._use_gl(beb._all_objs([test_plot, test_table])) is False
        assert beb._use_gl(beb._all_objs([test_plot, test_widget])) is False
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        assert beb._use_gl(beb._all_objs([d])) is False

    def test_with_gl(self, test_plot, test_glplot, test_table, test_widget) -> None:
        assert beb._use_gl(beb._all_objs([test_glplot])) is True
        assert beb._use_gl(beb._all_objs([test_plot, test_glplot])) is True
        assert beb._use_gl(beb._all_objs([test_plot, test_widget, test_glplot])) is True
        assert beb._use_gl(beb._all_objs([test_plot, test_widget, test_table, test_glplot])) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_glplot)
        assert beb._use_gl(beb._all_objs([d])) is True


class Test__use_tables:
    def test_without_tables(self, test_plot, test_glplot, test_table, test_widget) -> None:
        assert beb._use_tables(beb._all_objs([test_plot])) is False
        assert beb._use_tables(beb._all_objs([test_plot, test_glplot])) is False
        assert beb._use_tables(beb._all_objs([test_plot, test_widget])) is False
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_glplot)
        d.add_root(test_widget)
        assert beb._use_tables(beb._all_objs([d])) is False

    def test_with_tables(self, test_plot, test_glplot, test_table, test_widget) -> None:
        assert beb._use_tables(beb._all_objs([test_table])) is True
        assert beb._use_tables(beb._all_objs([test_table, test_plot])) is True
        assert beb._use_tables(beb._all_objs([test_table, test_plot, test_glplot])) is True
        assert beb._use_tables(beb._all_objs([test_table, test_widget, test_table, test_glplot])) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_glplot)
        assert beb._use_tables(beb._all_objs([d])) is True


class Test__use_widgets:
    def test_without_widgets(self, test_plot, test_glplot, test_table, test_widget) -> None:
        assert beb._use_widgets(beb._all_objs([test_plot])) is False
        assert beb._use_widgets(beb._all_objs([test_plot, test_glplot])) is False
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_glplot)
        assert beb._use_widgets(beb._all_objs([d])) is False

    def test_with_widgets(self, test_plot, test_glplot, test_table, test_widget) -> None:
        assert beb._use_widgets(beb._all_objs([test_widget])) is True
        assert beb._use_widgets(beb._all_objs([test_widget, test_plot])) is True
        assert beb._use_widgets(beb._all_objs([test_widget, test_plot, test_glplot])) is True
        assert beb._use_widgets(beb._all_objs([test_widget, test_plot, test_glplot, test_table])) is True
        assert beb._use_widgets(beb._all_objs([test_table, test_table, test_glplot])) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_glplot)
        assert beb._use_widgets(beb._all_objs([d])) is True


class Test__use_mathjax:
    def test_without_mathjax(self, test_plot, test_glplot, test_table, test_widget, test_mathtext) -> None:
        assert beb._use_mathjax(beb._all_objs([test_plot])) is False
        assert beb._use_mathjax(beb._all_objs([test_plot, test_glplot])) is False
        assert beb._use_mathjax(beb._all_objs([test_plot, test_table])) is False
        assert beb._use_mathjax(beb._all_objs([test_plot, test_widget])) is False
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        assert beb._use_mathjax(beb._all_objs([d])) is False

    def test_with_mathjax(self, test_plot, test_glplot, test_table, test_widget, test_mathtext, test_plaintext) -> None:
        assert beb._use_mathjax(beb._all_objs([test_mathtext])) is True
        assert beb._use_mathjax(beb._all_objs([test_plot, test_mathtext])) is True
        assert beb._use_mathjax(beb._all_objs([test_plot, test_glplot, test_mathtext])) is True
        assert beb._use_mathjax(beb._all_objs([test_plot, test_widget, test_mathtext])) is True
        assert beb._use_mathjax(beb._all_objs([test_plot, test_widget, test_table, test_mathtext])) is True
        assert beb._use_mathjax(beb._all_objs([test_plot, test_plaintext, test_mathtext])) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_mathtext)
        assert beb._use_mathjax(beb._all_objs([d])) is True

    def test_with_mathstring(self, test_plot, test_glplot, test_table, test_widget, test_mathtext,
            test_mathstring_axis_label, test_mathstring_major_label_overrides) -> None:
        assert beb._use_mathjax(beb._all_objs([test_mathstring_axis_label])) is True
        assert beb._use_mathjax(beb._all_objs([test_plot, test_mathstring_axis_label])) is True
        assert beb._use_mathjax(beb._all_objs([test_plot, test_glplot, test_mathstring_axis_label])) is True
        assert beb._use_mathjax(beb._all_objs([test_plot, test_widget, test_mathstring_axis_label])) is True
        assert beb._use_mathjax(beb._all_objs([test_plot, test_widget, test_table, test_mathstring_axis_label])) is True
        assert beb._use_mathjax(beb._all_objs([test_plot, test_mathtext, test_mathstring_axis_label])) is True
        assert beb._use_mathjax(beb._all_objs([test_plot, test_mathstring_major_label_overrides])) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_mathstring_axis_label)
        assert beb._use_mathjax(beb._all_objs([d])) is True

    def test_with_plaintext(self, test_plot, test_glplot, test_table, test_widget, test_mathtext, test_plaintext) -> None:
        assert beb._use_mathjax(beb._all_objs([test_plaintext])) is False
        assert beb._use_mathjax(beb._all_objs([test_plot, test_plaintext])) is False
        assert beb._use_mathjax(beb._all_objs([test_plot, test_glplot, test_plaintext])) is False
        assert beb._use_mathjax(beb._all_objs([test_plot, test_widget, test_plaintext])) is False
        assert beb._use_mathjax(beb._all_objs([test_plot, test_widget, test_table, test_plaintext])) is False
        assert beb._use_mathjax(beb._all_objs([test_plot, test_mathtext, test_plaintext])) is True
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        d.add_root(test_plaintext)
        assert beb._use_mathjax(beb._all_objs([d])) is False
#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
