# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
from pathlib import Path
from unittest.mock import MagicMock, patch

# Bokeh imports
import bokeh.io.saving as bis
from bokeh.core.templates import FILE
from bokeh.models import Plot
from bokeh.resources import Resources


def test_get_save_args_preserves_explicit_values() -> None:
    filename, resources, title = bis._get_save_args(Path("plot.html"), "inline", "Plot")
    assert filename == Path("plot.html")
    assert resources == Resources(mode="inline")
    assert title == "Plot"


@patch("bokeh.io.saving.default_filename", return_value="default.html")
def test_get_save_args_supplies_stateless_defaults(mock_default_filename: MagicMock) -> None:
    filename, resources, title = bis._get_save_args(None, None, None)
    assert filename == "default.html"
    assert resources.mode == "cdn"
    assert title == "Bokeh Plot"
    mock_default_filename.assert_called_once_with("html")


@patch("builtins.open")
@patch("bokeh.embed.file_html", return_value="<html></html>")
def test_save_helper_writes_artifact_html(mock_file_html: MagicMock, mock_open: MagicMock) -> None:
    obj = Plot()
    policy = Resources(mode="inline")

    bis._save_helper(obj, "plot.html", policy, "Plot", None)

    mock_file_html.assert_called_once_with(
        obj, resources=policy, title="Plot", template=FILE, theme=None,
    )
    mock_open.assert_called_once_with("plot.html", mode="w", encoding="utf-8")
    mock_open.return_value.__enter__.return_value.write.assert_called_once_with("<html></html>")
