#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from pathlib import Path

# External imports
from mock import MagicMock, patch

# Bokeh imports
from bokeh.core.templates import FILE
from bokeh.io.state import curstate
from bokeh.models import Plot
from bokeh.resources import INLINE

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
    filename, _, _ = bis._get_save_args(curstate(), "filename", "inline", "title")
    assert filename == "filename"

    filename, _, _ = bis._get_save_args(curstate(), Path("some") / "path" / "filename", "inline", "title")
    assert filename == Path("some") / "path" / "filename"

def test__get_save_args_default_filename() -> None:
    curstate().reset()
    curstate().output_file("filename")
    filename, _, _ = bis._get_save_args(curstate(), None, "inline", "title")
    assert filename == "filename"

def test__get_save_args_explicit_resources() -> None:
    _, resources, _ = bis._get_save_args(curstate(), "filename", "inline", "title")
    assert resources.mode == "inline" # TODO: == Resources(mode="inline")

    _, resources, _ = bis._get_save_args(curstate(), "filename", INLINE, "title")
    assert resources == INLINE

def test__get_save_args_default_resources() -> None:
    state = curstate()
    state.reset()
    state.output_file("filename")
    assert state.file is not None
    state.file.resources = INLINE
    _, resources, _ = bis._get_save_args(curstate(), "filename", None, "title")
    assert resources == INLINE

@patch('bokeh.io.saving.warn')
def test__get_save_args_missing_resources(mock_warn: MagicMock) -> None:
    curstate().reset()
    _, resources, _ = bis._get_save_args(curstate(), "filename", None, "title")
    assert resources.mode == "cdn"
    assert mock_warn.call_count == 1
    assert mock_warn.call_args[0] == (
        "save() called but no resources were supplied and output_file(...) was never called, defaulting to resources.CDN",
    )
    assert mock_warn.call_args[1] == {}

def test__get_save_args_explicit_title() -> None:
    _, _, title = bis._get_save_args(curstate(), "filename", "inline", "title")
    assert title == "title"

def test__get_save_args_default_title() -> None:
    state = curstate()
    state.reset()
    state.output_file("filename")
    assert state.file is not None
    state.file.title = "title"
    _, _, title = bis._get_save_args(curstate(), "filename", "inline", None)
    assert title == "title"

@patch('bokeh.io.saving.warn')
def test__get_save_args_missing_title(mock_warn: MagicMock) -> None:
    curstate().reset()
    _, _, title = bis._get_save_args(curstate(), "filename", "inline", None)
    assert title == "Bokeh Plot"
    assert mock_warn.call_count == 1
    assert mock_warn.call_args[0] == (
        "save() called but no title was supplied and output_file(...) was never called, using default title 'Bokeh Plot'",
    )
    assert mock_warn.call_args[1] == {}


@patch("builtins.open")
@patch("bokeh.embed.file_html")
def test__save_helper(mock_file_html: MagicMock, mock_open: MagicMock) -> None:
    obj = Plot()
    filename, resources, title = bis._get_save_args(curstate(), "filename", "inline", "title")

    bis._save_helper(obj, filename, resources, title, None)

    assert mock_file_html.call_count == 1
    assert mock_file_html.call_args[0] == (obj, resources)
    assert mock_file_html.call_args[1] == dict(title="title", template=FILE, theme=None)

    assert mock_open.call_count == 1
    assert mock_open.call_args[0] == (filename,)
    assert mock_open.call_args[1] == dict(mode="w", encoding="utf-8")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
