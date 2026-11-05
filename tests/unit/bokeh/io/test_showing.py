# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

import inspect
from pathlib import Path
from typing import Any, cast
from unittest.mock import MagicMock, patch

import pytest

from bokeh.application.application import Application
from bokeh.models import ColumnDataSource, GlyphRenderer, Plot

# Module under test
import bokeh.io.showing as m # isort:skip


@pytest.fixture(autouse=True)
def no_notebook_mode(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(m, "notebook_environment", lambda: False)


@pytest.mark.parametrize(("script", "writable", "expected"), [
    ("plot.py", True, "plot.html"),
    (None, True, "/tmp/bokeh.html"),
    ("plot.py", False, "/tmp/bokeh.html"),
])
@patch("bokeh.io.showing._show_file")
def test_show_derives_filename_with_temporary_fallback(mock_show_file: MagicMock,
        monkeypatch: pytest.MonkeyPatch, tmp_path: Path, script: str | None, writable: bool, expected: str) -> None:
    import bokeh.io.util as util

    if script is not None:
        script = str(tmp_path / script)
    if expected == "plot.html":
        expected = str(tmp_path / expected)
    monkeypatch.setattr(util, "detect_current_filename", lambda: script)
    monkeypatch.setattr(util, "_no_access", lambda path: not writable)
    monkeypatch.setattr(util, "_shares_exec_prefix", lambda path: False)
    mock_temp_filename = MagicMock(return_value="/tmp/bokeh.html")
    monkeypatch.setattr(util, "temp_filename", mock_temp_filename)
    plot = Plot()

    assert m.show(plot) is None

    if expected == "/tmp/bokeh.html":
        mock_temp_filename.assert_called_once_with("html")
    else:
        mock_temp_filename.assert_not_called()
    mock_show_file.assert_called_once_with(
        plot, filename=expected, resources=None, title=None, template=None,
    )


@patch("bokeh.io.showing._show_file")
def test_show_passes_explicit_file_options(mock_show_file: MagicMock) -> None:
    plot = Plot()

    m.show(plot, filename="plot.html", resources="inline", title="Plot")

    mock_show_file.assert_called_once_with(
        plot, filename="plot.html", resources="inline", title="Plot", template=None,
    )


@patch("bokeh.io.showing.show_doc", return_value="handle")
def test_show_uses_connected_notebook_output(mock_show_doc: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(m, "notebook_environment", lambda: True)
    plot = Plot()

    assert m.show(plot, resources="inline") == "handle"

    mock_show_doc.assert_called_once_with(plot, resources="inline")


@patch("bokeh.io.showing._show_file")
def test_explicit_filename_uses_file_output_in_notebook(mock_show_file: MagicMock,
        monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(m, "notebook_environment", lambda: True)

    m.show(Plot(), filename="plot.html")

    mock_show_file.assert_called_once()


def test_notebook_file_options_require_filename(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(m, "notebook_environment", lambda: True)

    with pytest.raises(ValueError, match="filename is required"):
        m.show(Plot(), title="Plot")


@patch("bokeh.io.notebook.show_hosted_app", return_value="handle")
def test_show_managed_application(mock_show_hosted_app: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    from bokeh.io.jupyter_app import NotebookApplication

    monkeypatch.setattr(m, "notebook_environment", lambda: True)
    app = object.__new__(NotebookApplication)

    assert m.show(app, resources="inline") == "handle"

    mock_show_hosted_app.assert_called_once_with(app, "inline")


def test_show_rejects_removed_options() -> None:
    parameters = inspect.signature(m.show).parameters
    assert "notebook_handle" not in parameters
    assert "notebook_url" not in parameters
    assert "browser" not in parameters
    assert "new" not in parameters

    for name, value in (
        ("notebook_handle", True),
        ("notebook_url", "https://example.test"),
        ("browser", "firefox"),
        ("new", "window"),
        ("live", True),
        ("made_up", True),
    ):
        with pytest.raises(TypeError, match=rf"unexpected keyword argument '{name}'"):
            m.show(Plot(), **cast(Any, {name: value}))


def test_show_rejects_managed_application_file_options(monkeypatch: pytest.MonkeyPatch) -> None:
    from bokeh.io.jupyter_app import NotebookApplication

    monkeypatch.setattr(m, "notebook_environment", lambda: True)
    app = object.__new__(NotebookApplication)

    with pytest.raises(ValueError, match="file output options"):
        m.show(app, filename="plot.html")


def test_show_accepts_multiple_objects() -> None:
    with patch.object(m, "_show_file"):
        m.show([])
        m.show([Plot()])
        m.show([Plot(), Plot()])


@pytest.mark.parametrize("obj", [
    1,
    2.3,
    None,
    "str",
    GlyphRenderer(data_source=ColumnDataSource()),
    Application(),
    lambda doc: None,
])
def test_show_rejects_bad_object(obj: object) -> None:
    with pytest.raises(ValueError, match="Invalid object to show"):
        m.show(obj)  # type: ignore[arg-type]


@patch("bokeh.io.showing.get_browser_controller")
@patch("bokeh.io.showing.save")
def test_show_file_saves_then_opens_browser(mock_save: MagicMock, mock_get_browser_controller: MagicMock,
        tmp_path: Path) -> None:
    controller = mock_get_browser_controller.return_value
    saved = tmp_path / "saved.html"
    mock_save.return_value = str(saved)

    m._show_file("obj", filename="plot.html", resources="cdn", title="Plot", template=None)  # type: ignore[arg-type]

    mock_save.assert_called_once_with(
        "obj", filename="plot.html", resources="cdn", title="Plot", template=None,
    )
    controller.open.assert_called_once_with(saved.as_uri(), new=2)
