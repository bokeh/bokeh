#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from bokeh import models
from bokeh.core.has_props import _default_resolver
from bokeh.document import Document
from bokeh.embed.bundle import URL, extension_dirs
from bokeh.ext import build
from bokeh.resources import CDN, INLINE, Resources
from tests.support.util.env import envset

# Module under test
import bokeh.embed.bundle as beb # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ABSOLUTE = Resources(mode="absolute")
SERVER = Resources(mode="server")

def plot() -> models.Plot:
    from bokeh.plotting import figure
    plot = figure()
    plot.scatter([1, 2], [2, 3])
    return plot

def glplot() -> models.Plot:
    from bokeh.plotting import figure
    glplot = figure(output_backend="webgl")
    glplot.scatter([1, 2], [2, 3])
    return glplot

def table() -> models.DataTable:
    return models.DataTable()

def widget() -> models.Button:
    return models.Button()

def mathtext() -> models.TeX:
    return models.TeX()

def mathstring_axis_label() -> models.LinearAxis:
    return models.LinearAxis(axis_label = "$$sin(x)$$")

def mathstring_axis_label_partial() -> models.LinearAxis:
    return models.LinearAxis(axis_label = "Sine $$sin(x)$$ function")

def mathstring_axis_label_with_parenthesis() -> models.LinearAxis:
    return models.LinearAxis(axis_label = r"\(sin(x)\)")

def mathstring_axis_label_with_parenthesis_partial() -> models.LinearAxis:
    return models.LinearAxis(axis_label = r"Sine \(sin(x)\) function")

def mathstring_major_label_overrides() -> models.LinearAxis:
    return models.LinearAxis(major_label_overrides = {0: r"\[sin(x)\]"})

def mathstring_major_label_overrides_partial() -> models.LinearAxis:
    return models.LinearAxis(major_label_overrides = {0: r"Sine \[sin(x)\] function"})

def plaintext() -> models.PlainText:
    return models.PlainText("$$sin(x)$$")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class Test_bundle_for_objs_and_resources:

    def test_no_objs_all_resources_bundled(self) -> None:
        b = beb.bundle_for_objs_and_resources(None, ABSOLUTE)
        assert any('bokeh-widgets' in f.url for f in b.js_files)
        assert any('bokeh-gl' in f.url for f in b.js_files)
        assert any('bokeh-tables' in f.url for f in b.js_files)
        assert any('bokeh-mathjax' in f.url for f in b.js_files)

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
        plot = models.Plot()
        plot.add_layout(LatexLabel(x=0, y=0))
        bundle = beb.bundle_for_objs_and_resources([plot], INLINE)
        assert len(bundle.js_raw) == 3
        assert "class LatexLabelView" in bundle.js_raw[2]

    def test_with_CDN_resources(self) -> None:
        from latex_label import LatexLabel
        plot = models.Plot()
        plot.add_layout(LatexLabel(x=0, y=0))
        bundle = beb.bundle_for_objs_and_resources([plot], CDN)
        assert len(bundle.js_files) == 2
        assert bundle.js_files[1] == URL("https://unpkg.com/latex_label@0.0.1/dist/latex_label.js")

    def test_with_Server_resources(self) -> None:
        from latex_label import LatexLabel
        plot = models.Plot()
        plot.add_layout(LatexLabel(x=0, y=0))
        bundle = beb.bundle_for_objs_and_resources([plot], SERVER)
        version_hash = "6b13789e43e5485634533de16a65d8ba9d34c4c9758588b665805435f80eb115"
        assert len(bundle.js_files) == 2
        assert (bundle.js_files[1] ==
                URL(f"http://localhost:5006/static/extensions/latex_label/latex_label.js?v={version_hash}"))

    def test_with_Server_resources_dev(self) -> None:
        from latex_label import LatexLabel
        plot = models.Plot()
        plot.add_layout(LatexLabel(x=0, y=0))
        with envset(BOKEH_DEV="true"):
            bundle = beb.bundle_for_objs_and_resources([plot], SERVER)
        assert len(bundle.js_files) == 2
        assert bundle.js_files[1] == URL("http://localhost:5006/static/extensions/latex_label/latex_label.js")

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
    def test_with_models(self) -> None:
        assert beb._any({plot(), table()}, lambda x: isinstance(x, models.Plot)) is True
        assert beb._any({plot(), table()}, lambda x: isinstance(x, models.Button)) is False


class Test__use_gl:
    def test_without_gl(self) -> None:
        assert beb._use_gl(beb._all_objs([plot()])) is False
        assert beb._use_gl(beb._all_objs([plot(), table()])) is False
        assert beb._use_gl(beb._all_objs([plot(), widget()])) is False
        d = Document()
        d.add_root(plot())
        d.add_root(table())
        d.add_root(widget())
        assert beb._use_gl(beb._all_objs([d])) is False

    def test_with_gl(self) -> None:
        assert beb._use_gl(beb._all_objs([glplot()])) is True
        assert beb._use_gl(beb._all_objs([plot(), glplot()])) is True
        assert beb._use_gl(beb._all_objs([plot(), widget(), glplot()])) is True
        assert beb._use_gl(beb._all_objs([plot(), widget(), table(), glplot()])) is True
        d = Document()
        d.add_root(plot())
        d.add_root(table())
        d.add_root(widget())
        d.add_root(glplot())
        assert beb._use_gl(beb._all_objs([d])) is True


class Test__use_tables:
    def test_without_tables(self) -> None:
        assert beb._use_tables(beb._all_objs([plot()])) is False
        assert beb._use_tables(beb._all_objs([plot(), glplot()])) is False
        assert beb._use_tables(beb._all_objs([plot(), widget()])) is False
        d = Document()
        d.add_root(plot())
        d.add_root(glplot())
        d.add_root(widget())
        assert beb._use_tables(beb._all_objs([d])) is False

    def test_with_tables(self) -> None:
        assert beb._use_tables(beb._all_objs([table()])) is True
        assert beb._use_tables(beb._all_objs([table(), plot()])) is True
        assert beb._use_tables(beb._all_objs([table(), plot(), glplot()])) is True
        assert beb._use_tables(beb._all_objs([table(), widget(), table(), glplot()])) is True
        d = Document()
        d.add_root(plot())
        d.add_root(table())
        d.add_root(widget())
        d.add_root(glplot())
        assert beb._use_tables(beb._all_objs([d])) is True


class Test__use_widgets:
    def test_without_widgets(self) -> None:
        assert beb._use_widgets(beb._all_objs([plot()])) is False
        assert beb._use_widgets(beb._all_objs([plot(), glplot()])) is False
        d = Document()
        d.add_root(plot())
        d.add_root(glplot())
        assert beb._use_widgets(beb._all_objs([d])) is False

    def test_with_widgets(self) -> None:
        assert beb._use_widgets(beb._all_objs([widget()])) is True
        assert beb._use_widgets(beb._all_objs([widget(), plot()])) is True
        assert beb._use_widgets(beb._all_objs([widget(), plot(), glplot()])) is True
        assert beb._use_widgets(beb._all_objs([widget(), plot(), glplot(), table()])) is True
        assert beb._use_widgets(beb._all_objs([table(), table(), glplot()])) is True
        d = Document()
        d.add_root(plot())
        d.add_root(table())
        d.add_root(widget())
        d.add_root(glplot())
        assert beb._use_widgets(beb._all_objs([d])) is True


class Test__use_mathjax:
    def test_without_mathjax(self) -> None:
        assert beb._use_mathjax(beb._all_objs([plot()])) is False
        assert beb._use_mathjax(beb._all_objs([plot(), glplot()])) is False
        assert beb._use_mathjax(beb._all_objs([plot(), table()])) is False
        assert beb._use_mathjax(beb._all_objs([plot(), widget()])) is False
        d = Document()
        d.add_root(plot())
        d.add_root(table())
        d.add_root(widget())
        assert beb._use_mathjax(beb._all_objs([d])) is False

    def test_with_mathjax(self) -> None:
        assert beb._use_mathjax(beb._all_objs([mathtext()])) is True
        assert beb._use_mathjax(beb._all_objs([plot(), mathtext()])) is True
        assert beb._use_mathjax(beb._all_objs([plot(), glplot(), mathtext()])) is True
        assert beb._use_mathjax(beb._all_objs([plot(), widget(), mathtext()])) is True
        assert beb._use_mathjax(beb._all_objs([plot(), widget(), table(), mathtext()])) is True
        assert beb._use_mathjax(beb._all_objs([plot(), plaintext(), mathtext()])) is True
        d = Document()
        d.add_root(plot())
        d.add_root(table())
        d.add_root(widget())
        d.add_root(mathtext())
        assert beb._use_mathjax(beb._all_objs([d])) is True

    def test_with_mathstring(self) -> None:
        assert beb._use_mathjax(beb._all_objs([mathstring_axis_label()])) is True
        assert beb._use_mathjax(beb._all_objs([plot(), mathstring_axis_label()])) is True
        assert beb._use_mathjax(beb._all_objs([plot(), glplot(), mathstring_axis_label()])) is True
        assert beb._use_mathjax(beb._all_objs([plot(), widget(), mathstring_axis_label()])) is True
        assert beb._use_mathjax(beb._all_objs([plot(), widget(), table(), mathstring_axis_label()])) is True
        assert beb._use_mathjax(beb._all_objs([plot(), mathtext(), mathstring_axis_label()])) is True
        assert beb._use_mathjax(beb._all_objs([plot(), mathstring_major_label_overrides()])) is True

        assert beb._use_mathjax(beb._all_objs([mathstring_axis_label_partial()])) is True
        assert beb._use_mathjax(beb._all_objs([mathstring_axis_label_with_parenthesis_partial()])) is True
        assert beb._use_mathjax(beb._all_objs([mathstring_major_label_overrides_partial()])) is True

        d = Document()
        d.add_root(plot())
        d.add_root(table())
        d.add_root(widget())
        d.add_root(mathstring_axis_label())
        assert beb._use_mathjax(beb._all_objs([d])) is True

    def test_with_plaintext(self) -> None:
        assert beb._use_mathjax(beb._all_objs([plaintext()])) is False
        assert beb._use_mathjax(beb._all_objs([plot(), plaintext()])) is False
        assert beb._use_mathjax(beb._all_objs([plot(), glplot(), plaintext()])) is False
        assert beb._use_mathjax(beb._all_objs([plot(), widget(), plaintext()])) is False
        assert beb._use_mathjax(beb._all_objs([plot(), widget(), table(), plaintext()])) is False
        assert beb._use_mathjax(beb._all_objs([plot(), mathtext(), plaintext()])) is True
        d = Document()
        d.add_root(plot())
        d.add_root(table())
        d.add_root(widget())
        d.add_root(plaintext())
        assert beb._use_mathjax(beb._all_objs([d])) is False
#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
