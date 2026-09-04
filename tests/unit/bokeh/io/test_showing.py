# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
from unittest.mock import MagicMock, patch

# External imports
import pytest

# Bokeh imports
import bokeh.io.notebook as notebook
import bokeh.io.showing as bis
from bokeh.application.application import Application
from bokeh.models import ColumnDataSource, GlyphRenderer, Plot


@pytest.fixture(autouse=True)
def no_notebook_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(notebook, "_NOTEBOOK_TYPE", None)


@patch("bokeh.io.showing._show_file")
@patch("bokeh.io.showing.temp_filename", return_value="/tmp/bokeh.html")
def test_show_uses_temporary_file_by_default(mock_temp_filename: MagicMock, mock_show_file: MagicMock) -> None:
    plot = Plot()
    assert bis.show(plot) is None
    mock_temp_filename.assert_called_once_with("html")
    mock_show_file.assert_called_once_with(
        plot, filename="/tmp/bokeh.html", resources=None, title=None, template=None,
    )


@patch("bokeh.io.showing._show_file")
def test_show_passes_explicit_file_options_to_save_path(mock_show_file: MagicMock) -> None:
    plot = Plot()
    bis.show(plot, filename="plot.html", resources="inline", title="Plot")
    mock_show_file.assert_called_once_with(
        plot, filename="plot.html", resources="inline", title="Plot", template=None,
    )


@patch("bokeh.io.showing.run_notebook_hook", return_value="handle")
def test_show_uses_notebook_hook_without_filename(mock_run_notebook_hook: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(notebook, "_NOTEBOOK_TYPE", "jupyter")
    plot = Plot()
    assert bis.show(plot, notebook_handle=True) == "handle"
    mock_run_notebook_hook.assert_called_once_with("jupyter", "doc", plot, True)


@patch("bokeh.io.showing._show_file")
def test_explicit_filename_uses_file_output_in_notebook_mode(mock_show_file: MagicMock,
        monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(notebook, "_NOTEBOOK_TYPE", "jupyter")
    plot = Plot()
    bis.show(plot, filename="plot.html")
    mock_show_file.assert_called_once()


@patch("bokeh.io.showing.run_notebook_hook")
def test_show_application_uses_notebook_hook(mock_run_notebook_hook: MagicMock,
        monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(notebook, "_NOTEBOOK_TYPE", "jupyter")
    app = Application()
    bis.show(app, notebook_url="baz")
    mock_run_notebook_hook.assert_called_once_with("jupyter", "app", app, "baz")


@pytest.mark.parametrize("obj", [1, 2.3, None, "str", GlyphRenderer(data_source=ColumnDataSource())])
def test_show_rejects_bad_object(obj: object) -> None:
    with pytest.raises(ValueError):
        bis.show(obj)  # type: ignore[arg-type]


@patch("bokeh.io.showing.get_browser_controller")
@patch("bokeh.io.showing.save", return_value="/tmp/saved.html")
def test_show_file_saves_then_opens_browser(mock_save: MagicMock, mock_get_browser_controller: MagicMock) -> None:
    controller = mock_get_browser_controller.return_value
    bis._show_file("obj", filename="plot.html", resources="cdn", title="Plot", template=None)  # type: ignore[arg-type]
    mock_save.assert_called_once_with(
        "obj", filename="plot.html", resources="cdn", title="Plot", template=None,
    )
    controller.open.assert_called_once_with("file:///tmp/saved.html", new=2)
