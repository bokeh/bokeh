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
from pathlib import Path, PurePosixPath, PureWindowsPath
from unittest.mock import MagicMock, patch

# Bokeh imports
from bokeh.core.templates import FILE
from bokeh.io.jupyter import FILE_MIME_TYPE
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

@patch("bokeh.io.saving._save_helper")
def test_save_returns_string_with_safe_notebook_link(mock_save_helper: MagicMock) -> None:
    result = bis.save(
        Plot(),
        filename=Path("reports") / 'plot & "details".html',
        resources=INLINE,
        title="title",
    )

    assert isinstance(result, str)
    assert result == str(Path.cwd() / "reports" / 'plot & "details".html')
    html = (
        '<a href="reports/plot%20%26%20%22details%22.html" target="_blank" rel="noopener noreferrer">'
        "Open reports/plot &amp; &quot;details&quot;.html</a>"
    )
    payload = {
        "protocol_version": 2,
        "kind": "file",
        "path": 'reports/plot & "details".html',
    }
    assert result._repr_html_() == html
    text = 'Bokeh HTML file saved: reports/plot & "details".html'
    assert result._repr_mimebundle_() == {FILE_MIME_TYPE: payload, "text/html": html, "text/plain": text}
    assert result._repr_mimebundle_(include={FILE_MIME_TYPE}) == {FILE_MIME_TYPE: payload}
    assert result._repr_mimebundle_(exclude={FILE_MIME_TYPE}) == {"text/html": html, "text/plain": text}
    mock_save_helper.assert_called_once()


@pytest.mark.parametrize("filename", [Path("/private/output.html"), Path("..") / "output.html"])
@patch("bokeh.io.saving._save_helper")
def test_save_omits_rich_paths_that_are_not_notebook_relative(mock_save_helper: MagicMock, filename: Path) -> None:
    result = bis.save(Plot(), filename=filename, resources=INLINE, title="title")

    assert result._repr_mimebundle_() == {
        "text/plain": "Bokeh HTML file saved. Open it from the notebook file browser.",
    }
    assert str(filename) not in next(iter(result._repr_mimebundle_().values()))


@pytest.mark.parametrize(("path_type", "expected"), [
    (PureWindowsPath, "reports/plot.html"),
    (PurePosixPath, None),
])
def test_saved_file_normalizes_native_separators(path_type: type[Path], expected: str | None) -> None:
    with patch.object(bis, "Path", path_type):
        result = bis._SavedFile("result.html", r"reports\plot.html")

    assert result._link_path == expected

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
    state.output_file("filename", mode="inline")
    assert state.file is not None
    assert state.file.resources.mode == "inline"
    r = state.file.resources
    _, resources, _ = bis._get_save_args(curstate(), "filename", None, "title")
    assert resources == r

@patch('bokeh.util.warnings.warn')
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
    state.output_file("filename", title="title")
    assert state.file is not None
    assert state.file.title == "title"
    _, _, title = bis._get_save_args(curstate(), "filename", "inline", None)
    assert title == "title"

@patch('bokeh.util.warnings.warn')
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
    mock_open.reset_mock() # remove this entry: call('/usr/share/zoneinfo/UTC', 'rb')

    bis._save_helper(obj, filename, resources, title, None)

    assert mock_file_html.call_count == 1
    assert mock_file_html.call_args[0] == (obj,)
    assert mock_file_html.call_args[1] == dict(resources=resources, title="title", template=FILE, theme=None)

    assert mock_open.call_count == 1
    assert mock_open.call_args[0] == (filename,)
    assert mock_open.call_args[1] == dict(mode="w", encoding="utf-8")

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
