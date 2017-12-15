#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

from bokeh.util.api import DEV, GENERAL ; DEV, GENERAL
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from mock import patch

# External imports

# Bokeh imports
from bokeh.io.state import curstate
from bokeh.resources import Resources

# Module under test
import bokeh.io.output as bio

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

        ( 'output_file',     (1, 0, 0) ),
        ( 'output_notebook', (1, 0, 0) ),
        ( 'reset_output',    (1, 0, 0) ),

    ), DEV: (

    )

}

Test_api = verify_api(bio, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_output_file(object):

    @patch('bokeh.io.state.State.output_file')
    def test_no_args(self, mock_output_file):
        default_kwargs = dict(title="Bokeh Plot", mode="cdn", root_dir=None)
        bio.output_file("foo.html")
        assert mock_output_file.call_count == 1
        assert mock_output_file.call_args[0] == ("foo.html",)
        assert mock_output_file.call_args[1] == default_kwargs

    @patch('bokeh.io.state.State.output_file')
    def test_with_args(self, mock_output_file):
        kwargs = dict(title="title", mode="cdn", root_dir="foo")
        bio.output_file("foo.html", **kwargs)
        assert mock_output_file.call_count == 1
        assert mock_output_file.call_args[0] == ("foo.html",)
        assert mock_output_file.call_args[1] == kwargs

class Test_output_notebook(object):

    @patch('bokeh.io.output.run_notebook_hook')
    def test_no_args(self, mock_run_notebook_hook):
        default_load_jupyter_args = (None, False, False, 5000)
        bio.output_notebook()
        assert mock_run_notebook_hook.call_count == 1
        assert mock_run_notebook_hook.call_args[0] == ("jupyter", "load") + default_load_jupyter_args
        assert mock_run_notebook_hook.call_args[1] == {}

    @patch('bokeh.io.output.run_notebook_hook')
    def test_with_args(self, mock_run_notebook_hook):
        load_jupyter_args = (Resources(), True, True, 1000)
        bio.output_notebook(*load_jupyter_args)
        assert mock_run_notebook_hook.call_count == 1
        assert mock_run_notebook_hook.call_args[0] == ("jupyter", "load") + load_jupyter_args
        assert mock_run_notebook_hook.call_args[1] == {}

@patch('bokeh.io.state.State.reset')
def test_reset_output(mock_reset):
    # might create a new one, which also calls reset
    original_call_count = curstate().reset.call_count
    bio.reset_output()
    assert curstate().reset.call_count == original_call_count+1

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
