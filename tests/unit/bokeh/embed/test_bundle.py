#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os
from os.path import dirname, join

# Bokeh imports
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

        os.environ['BOKEH_RESOURCES'] = "server-dev"
        b = beb.bundle_for_objs_and_resources([], INLINE)
        del os.environ['BOKEH_RESOURCES']
        assert any('localhost' in x for x in b.js_files)

        # this is a cheap test that a BokehJS file is NOT inline
        assert all(len(x) < 5000 for x in b.js_raw)

        os.environ['BOKEH_RESOURCES'] = "cdn"
        b = beb.bundle_for_objs_and_resources([], INLINE)
        del os.environ['BOKEH_RESOURCES']
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
        assert bundle.js_files[1] == "https://unpkg.com/latex_label@^0.0.1/dist/latex_label.js"

    def test_with_Server_resources(self) -> None:
        from latex_label import LatexLabel
        plot = Plot()
        plot.add_layout(LatexLabel())
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

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
