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

# External imports
from mock import patch

# Bokeh imports
from bokeh.io.state import curstate
from bokeh.models import Plot

# Module under test
import bokeh.io.saving as bis # isort:skip

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

def test__get_save_args_explicit_filename() -> None:
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", "title")
    assert filename == "filename"

def test__get_save_args_default_filename() -> None:
    curstate().reset()
    curstate().output_file("filename")
    filename, resources, title = bis._get_save_args(curstate(), None, "resources", "title")
    assert filename == "filename"

def test__get_save_args_explicit_resources() -> None:
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", "title")
    assert resources == "resources"

def test__get_save_args_default_resources() -> None:
    curstate().reset()
    curstate().output_file("filename")
    curstate().file['resources'] = "resources"
    filename, resources, title = bis._get_save_args(curstate(), "filename", None, "title")
    assert resources == "resources"

@patch('bokeh.io.saving.warn')
def test__get_save_args_missing_resources(mock_warn) -> None:
    curstate().reset()
    filename, resources, title = bis._get_save_args(curstate(), "filename", None, "title")
    assert resources.mode == "cdn"
    assert mock_warn.call_count == 1
    assert mock_warn.call_args[0] == (
        "save() called but no resources were supplied and output_file(...) was never called, defaulting to resources.CDN",
    )
    assert mock_warn.call_args[1] == {}

def test__get_save_args_explicit_title() -> None:
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", "title")
    assert title == "title"

def test__get_save_args_default_title() -> None:
    curstate().reset()
    curstate().output_file("filename")
    curstate().file['title'] = "title"
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", None)
    assert title == "title"

@patch('bokeh.io.saving.warn')
def test__get_save_args_missing_title(mock_warn) -> None:
    curstate().reset()
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", None)
    assert title == "Bokeh Plot"
    assert mock_warn.call_count == 1
    assert mock_warn.call_args[0] == (
        "save() called but no title was supplied and output_file(...) was never called, using default title 'Bokeh Plot'",
    )
    assert mock_warn.call_args[1] == {}


@patch("builtins.open")
@patch("bokeh.embed.file_html")
def test__save_helper(mock_file_html, mock_open) -> None:
    obj = Plot()
    filename, resources, title = bis._get_save_args(curstate(), "filename", "resources", "title")

    bis._save_helper(obj, filename, resources, title, None)

    assert mock_file_html.call_count == 1
    assert mock_file_html.call_args[0] == (obj, resources)
    assert mock_file_html.call_args[1] == dict(title="title", template=None, theme=None)

    assert mock_open.call_count == 1
    assert mock_open.call_args[0] == (filename,)
    assert mock_open.call_args[1] == dict(mode="w", encoding="utf-8")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
