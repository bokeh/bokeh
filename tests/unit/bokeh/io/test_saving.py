# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import os
import pickle
from copy import copy, deepcopy
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Any, cast
from unittest.mock import MagicMock, patch

# External imports
import pytest

# Bokeh imports
from bokeh.core.templates import FILE
from bokeh.embed._util import ThemePolicy
from bokeh.io.jupyter import FILE_MIME_TYPE
from bokeh.models import Plot
from bokeh.resources import Resources

# Module under test
import bokeh.io.saving as m # isort:skip


def _write_saved_file(_obj: Any, filename: Any, *_args: Any, **_kwargs: Any) -> None:
    path = Path(filename)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("saved")


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

    bundle = result._repr_mimebundle_()
    if expected is None:
        assert bundle == {"text/plain": "Bokeh HTML file saved. Open it from the notebook file browser."}
    else:
        assert bundle[FILE_MIME_TYPE]["path"] == expected


@patch("bokeh.io.saving._save_helper")
def test_save_links_from_the_notebook_directory_after_chdir(mock_save_helper: MagicMock, tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch) -> None:
    pytest.importorskip("IPython")
    work = tmp_path / "work"
    work.mkdir()
    mock_save_helper.side_effect = _write_saved_file
    shell = MagicMock(kernel=object(), starting_dir=str(tmp_path))
    monkeypatch.chdir(work)
    with patch("IPython.get_ipython", return_value=shell):
        result = cast(m._SavedFile, m.save(Plot(), filename="../reports/result.html"))

    assert result._repr_mimebundle_()[FILE_MIME_TYPE]["path"] == "reports/result.html"
    mock_save_helper.assert_called_once()


@patch("bokeh.io.saving._save_helper")
def test_save_preserves_a_lexical_link_through_a_symlinked_directory(mock_save_helper: MagicMock,
        tmp_path: Path) -> None:
    pytest.importorskip("IPython")
    target = tmp_path / "target"
    target.mkdir()
    linked = tmp_path / "linked"
    linked.symlink_to(target, target_is_directory=True)
    mock_save_helper.side_effect = _write_saved_file
    shell = MagicMock(kernel=object(), starting_dir=str(tmp_path))
    with patch("IPython.get_ipython", return_value=shell):
        result = cast(m._SavedFile, m.save(Plot(), filename=linked / "result.html"))

    assert result._repr_mimebundle_()[FILE_MIME_TYPE]["path"] == "linked/result.html"
    mock_save_helper.assert_called_once()


@pytest.mark.skipif(os.name == "nt", reason="Windows normalizes '..' before traversing a directory symlink")
@patch("bokeh.io.saving._save_helper")
def test_save_omits_a_lexical_link_that_names_a_different_file(mock_save_helper: MagicMock,
        tmp_path: Path) -> None:
    pytest.importorskip("IPython")
    notebook = tmp_path / "notebook"
    notebook.mkdir()
    external = tmp_path / "external"
    (external / "data").mkdir(parents=True)
    (notebook / "data").symlink_to(external / "data", target_is_directory=True)
    mock_save_helper.side_effect = _write_saved_file
    shell = MagicMock(kernel=object(), starting_dir=str(notebook))

    with patch("IPython.get_ipython", return_value=shell):
        result = cast(m._SavedFile, m.save(Plot(), filename=notebook / "data" / ".." / "summary.html"))

    assert result._repr_mimebundle_() == {
        "text/plain": "Bokeh HTML file saved. Open it from the notebook file browser.",
    }
    assert (external / "summary.html").is_file()


@patch("bokeh.io.saving._save_helper")
def test_save_links_an_absolute_path_through_a_symlinked_notebook_directory(mock_save_helper: MagicMock,
        tmp_path: Path) -> None:
    pytest.importorskip("IPython")
    target = tmp_path / "target"
    target.mkdir()
    alias = tmp_path / "alias"
    alias.symlink_to(target, target_is_directory=True)
    mock_save_helper.side_effect = _write_saved_file
    shell = MagicMock(kernel=object(), starting_dir=str(target))

    with patch("IPython.get_ipython", return_value=shell):
        result = cast(m._SavedFile, m.save(Plot(), filename=alias / "result.html"))

    assert result._repr_mimebundle_()[FILE_MIME_TYPE]["path"] == "result.html"


@pytest.mark.parametrize("clone", [copy, deepcopy, lambda value: pickle.loads(pickle.dumps(value))])
def test_saved_file_copy_and_pickle_preserve_rich_link(clone: Any) -> None:
    original = m._SavedFile("/tmp/result.html", "reports/result.html")

    result = clone(original)

    assert result == original
    assert result._repr_mimebundle_()[FILE_MIME_TYPE]["path"] == "reports/result.html"


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
@patch("bokeh.io.saving.embed")
def test_save_helper_writes_embed_html(mock_embed: MagicMock, mock_open: MagicMock) -> None:
    obj = Plot()
    policy = Resources(mode="inline")
    mock_embed.return_value.page.return_value = "<html></html>"

    m._save_helper(obj, "plot.html", policy, "Plot", None)

    mock_embed.assert_called_once_with(obj, theme=ThemePolicy.SOURCE_OR_CURDOC)
    mock_embed.return_value.page.assert_called_once_with(
        resources=policy, title="Plot", template=FILE,
    )
    mock_open.assert_called_once_with("plot.html", mode="w", encoding="utf-8")
    mock_open.return_value.__enter__.return_value.write.assert_called_once_with("<html></html>")
