#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.document import Document

# Module under test
import bokeh.embed.bundle as beb

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@pytest.fixture
def test_plot():
    from bokeh.plotting import figure
    test_plot = figure()
    test_plot.circle([1, 2], [2, 3])
    return test_plot

@pytest.fixture
def test_glplot():
    from bokeh.plotting import figure
    test_glplot = figure(output_backend="webgl")
    test_glplot.circle([1, 2], [2, 3])
    return test_glplot

@pytest.fixture
def test_table():
    from bokeh.models import DataTable
    test_table = DataTable()
    return test_table

@pytest.fixture
def test_widget():
    from bokeh.models import Button
    test_widget = Button()
    return test_widget

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_bundle_for_objs_and_resources(object):
    pass

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class Test__any(object):

    def test_with_models(self, test_plot, test_table):
        from bokeh.models import Button
        assert beb._any([test_plot, test_table], lambda x: isinstance(x, object)) is True
        assert beb._any([test_plot, test_table], lambda x: isinstance(x, Button)) is False

    def test_with_doc(self, test_plot, test_table):
        from bokeh.models import Button
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        assert beb._any([d], lambda x: isinstance(x, object)) is True
        assert beb._any([d], lambda x: isinstance(x, Button)) is False


class Test__use_gl(object):

    def test_without_gl(self, test_plot, test_glplot, test_table, test_widget):
        assert beb._use_gl([test_plot]) is False
        assert beb._use_gl([test_plot, test_table]) is False
        assert beb._use_gl([test_plot, test_widget]) is False
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_table)
        d.add_root(test_widget)
        assert beb._use_gl([d]) is False

    def test_with_gl(self, test_plot, test_glplot, test_table, test_widget):
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

class Test__use_tables(object):

    def test_without_tables(self, test_plot, test_glplot, test_table, test_widget):
        assert beb._use_tables([test_plot]) is False
        assert beb._use_tables([test_plot, test_glplot]) is False
        assert beb._use_tables([test_plot, test_widget]) is False
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_glplot)
        d.add_root(test_widget)
        assert beb._use_tables([d]) is False

    def test_with_tables(self, test_plot, test_glplot, test_table, test_widget):
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

class Test__use_widgets(object):

    def test_without_widgets(self, test_plot, test_glplot, test_table, test_widget):
        assert beb._use_widgets([test_plot]) is False
        assert beb._use_widgets([test_plot, test_glplot]) is False
        d = Document()
        d.add_root(test_plot)
        d.add_root(test_glplot)
        assert beb._use_widgets([d]) is False

    def test_with_widgets(self, test_plot, test_glplot, test_table, test_widget):
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
