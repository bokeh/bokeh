#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import cast
from unittest.mock import MagicMock, patch

# External imports
import pytest

# Bokeh imports
from bokeh.core.templates import FILE
from bokeh.io.jupyter import FILE_MIME_TYPE
from bokeh.models import Plot
from bokeh.resources import Resources

# Module under test
import bokeh.io.saving as m # isort:skip


@patch("bokeh.io.saving._save_helper")
def test_save_returns_string_with_safe_notebook_link(mock_save_helper: MagicMock) -> None:
    result = cast(m._SavedFile, m.save(
        Plot(),
        filename=Path("reports") / 'plot & "details".html',
        resources="inline",
        title="title",
    ))

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
    result = cast(m._SavedFile, m.save(Plot(), filename=filename, resources="inline", title="title"))

    assert result._repr_mimebundle_() == {
        "text/plain": "Bokeh HTML file saved. Open it from the notebook file browser.",
    }
    assert str(filename) not in next(iter(result._repr_mimebundle_().values()))


@pytest.mark.parametrize(("path_type", "path", "expected"), [
    (PureWindowsPath, r"reports\plot.html", "reports/plot.html"),
    (PureWindowsPath, "/private/output.html", None),
    (PurePosixPath, r"reports\plot.html", None),
])
def test_saved_file_normalizes_native_separators(path_type: type[Path], path: str, expected: str | None) -> None:
    with patch.object(m, "Path", path_type):
        result = m._SavedFile("result.html", path)

    assert result._link_path == expected


def test_get_save_args_preserves_explicit_values() -> None:
    filename, resources, title = m._get_save_args(Path("plot.html"), "inline", "Plot")

    assert filename == Path("plot.html")
    assert resources == Resources(mode="inline")
    assert title == "Plot"


@patch("bokeh.io.saving.default_filename", return_value="default.html")
def test_get_save_args_supplies_stateless_defaults(mock_default_filename: MagicMock) -> None:
    filename, resources, title = m._get_save_args(None, None, None)

    assert filename == "default.html"
    assert resources.mode == "cdn"
    assert title == "Bokeh Plot"
    mock_default_filename.assert_called_once_with("html")


@patch("builtins.open")
@patch("bokeh.embed.file_html", return_value="<html></html>")
def test_save_helper_writes_artifact_html(mock_file_html: MagicMock, mock_open: MagicMock) -> None:
    obj = Plot()
    resources = Resources(mode="inline")

    m._save_helper(obj, "plot.html", resources, "Plot", None)

    mock_file_html.assert_called_once_with(
        obj, resources=resources, title="Plot", template=FILE, theme=None,
    )
    mock_open.assert_called_once_with("plot.html", mode="w", encoding="utf-8")
    mock_open.return_value.__enter__.return_value.write.assert_called_once_with("<html></html>")
