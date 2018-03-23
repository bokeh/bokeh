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

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from mock import patch

# External imports

# Bokeh imports
from bokeh.io.state import curstate
from bokeh.models.plots import Plot

# Module under test
import bokeh.io.saving as bis

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__get_save_args_explicit_filename():
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", "title")
    assert filename == "filename"

def test__get_save_args_default_filename():
    curstate().reset()
    curstate().output_file("filename")
    filename, resources, title = bis._get_save_args(curstate(), None, "resources", "title")
    assert filename == "filename"

def test__get_save_args_explicit_resources():
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", "title")
    assert resources == "resources"

def test__get_save_args_default_resources():
    curstate().reset()
    curstate().output_file("filename")
    curstate().file['resources'] = "resources"
    filename, resources, title = bis._get_save_args(curstate(), "filename", None, "title")
    assert resources == "resources"

@patch('bokeh.io.saving.warn')
def test__get_save_args_missing_resources(mock_warn):
    from bokeh.resources import CDN
    curstate().reset()
    filename, resources, title = bis._get_save_args(curstate(), "filename", None, "title")
    assert resources == CDN
    assert mock_warn.call_count == 1
    assert mock_warn.call_args[0] == (
        "save() called but no resources were supplied and output_file(...) was never called, defaulting to resources.CDN",
    )
    assert mock_warn.call_args[1] == {}

def test__get_save_args_explicit_title():
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", "title")
    assert title == "title"

def test__get_save_args_default_title():
    curstate().reset()
    curstate().output_file("filename")
    curstate().file['title'] = "title"
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", None)
    assert title == "title"

@patch('bokeh.io.saving.warn')
def test__get_save_args_missing_title(mock_warn):
    curstate().reset()
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", None)
    assert title == "Bokeh Plot"
    assert mock_warn.call_count == 1
    assert mock_warn.call_args[0] == (
        "save() called but no title was supplied and output_file(...) was never called, using default title 'Bokeh Plot'",
    )
    assert mock_warn.call_args[1] == {}


@patch('io.open')
@patch('bokeh.embed.file_html')
def test__save_helper(mock_file_html, mock_io_open):
    obj = Plot()
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", "title")

    bis._save_helper(obj, filename, resources, title, None)

    assert mock_file_html.call_count == 1
    assert mock_file_html.call_args[0] == (obj, resources)
    assert mock_file_html.call_args[1] == dict(title="title", template=None)

    assert mock_io_open.call_count == 1
    assert mock_io_open.call_args[0] == (filename,)
    assert mock_io_open.call_args[1] == dict(mode="w", encoding="utf-8")
