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
import tempfile

from mock import patch
import os

# External imports

# Bokeh imports
from bokeh.document import Document
from bokeh.layouts import row
from bokeh.plotting import figure

# Module under test
import bokeh.command.util as util

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_die(capsys):
    with pytest.raises(SystemExit):
        util.die("foo")
    out, err = capsys.readouterr()
    assert err == "foo\n"
    assert out == ""

def test_build_single_handler_application_unknown_file():
    with pytest.raises(ValueError) as e:
        f = tempfile.NamedTemporaryFile(suffix=".bad")
        util.build_single_handler_application(f.name)
    assert "Expected a '.py' script or '.ipynb' notebook, got: " in str(e)

def test_build_single_handler_application_nonexistent_file():
    with pytest.raises(ValueError) as e:
        util.build_single_handler_application("junkjunkjunk")
    assert "Path for Bokeh server application does not exist: " in str(e)

DIRSTYLE_MAIN_WARNING_COPY = """
It looks like you might be running the main.py of a directory app directly.
If this is the case, to enable the features of directory style apps, you must
call "bokeh serve" on the directory instead. For example:

    bokeh serve my_app_dir/

If this is not the case, renaming main.py will supress this warning.
"""

@patch('warnings.warn')
def test_build_single_handler_application_main_py(mock_warn):
    f = tempfile.NamedTemporaryFile(suffix="main.py", delete=False)
    f.close() #close file to open it later on windows
    util.build_single_handler_application(f.name)
    assert mock_warn.called
    assert mock_warn.call_args[0] == (DIRSTYLE_MAIN_WARNING_COPY,)
    os.remove(f.name)

_SIZE_WARNING = "Width/height arguments will be ignored for this muliple layout. (Size valus only apply when exporting single plots.)"

class Test_set_single_plot_width_height(object):
    def test_neither(self):
        p = figure(plot_width=200, plot_height=300)
        d = Document()
        d.add_root(p)
        util.set_single_plot_width_height(d, None, None)
        assert p.plot_width == 200
        assert p.plot_height == 300

    def test_width(self):
        p = figure(plot_width=200, plot_height=300)
        d = Document()
        d.add_root(p)
        util.set_single_plot_width_height(d, 400, None)
        assert p.plot_width == 400
        assert p.plot_height == 300

    def test_height(self):
        p = figure(plot_width=200, plot_height=300)
        d = Document()
        d.add_root(p)
        util.set_single_plot_width_height(d, None, 400)
        assert p.plot_width == 200
        assert p.plot_height == 400

    def test_both(self):
        p = figure(plot_width=200, plot_height=300)
        d = Document()
        d.add_root(p)
        util.set_single_plot_width_height(d, 400, 500)
        assert p.plot_width == 400
        assert p.plot_height == 500

    def test_multiple_roots(self):
        p1 = figure(plot_width=200, plot_height=300)
        p2 = figure(plot_width=200, plot_height=300)
        d = Document()
        d.add_root(p1)
        d.add_root(p2)
        with pytest.warns(UserWarning) as warns:
            util.set_single_plot_width_height(d, 400, 500)
            assert len(warns) == 1
            assert warns[0].message.args[0] == _SIZE_WARNING

    def test_layout(self):
        p = figure(plot_width=200, plot_height=300)
        d = Document()
        d.add_root(row(p))
        with pytest.warns(UserWarning) as warns:
            util.set_single_plot_width_height(d, 400, 500)
            assert len(warns) == 1
            assert warns[0].message.args[0] == _SIZE_WARNING

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
