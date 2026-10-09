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
import os
import subprocess
import sys
from unittest.mock import ANY, MagicMock, patch

# Bokeh imports
from bokeh.embed._util import ThemePolicy
from bokeh.models import Plot

# Module under test
import bokeh.io.util as biu # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@pytest.mark.parametrize("module", [False, True])
def test_detect_current_filename(tmp_path: os.PathLike, module: bool) -> None:
    script = tmp_path / "script.py"
    script.write_text("from bokeh.io.util import detect_current_filename\nprint(detect_current_filename())\n")
    arguments = ["-m", "script"] if module else [str(script)]
    result = subprocess.run([sys.executable, *arguments], cwd=tmp_path, capture_output=True, text=True, check=True)
    assert result.stdout.strip() == str(script)

def test_temp_filename() -> None:
    with patch('bokeh.io.util.NamedTemporaryFile', **{
        'return_value.__enter__.return_value.name': 'Junk.test',
    }) as mock_tmp:
        r = biu.temp_filename("test")
        assert r == "Junk.test"
        assert mock_tmp.called
        assert mock_tmp.call_args[0] == ()
        assert mock_tmp.call_args[1] == {'suffix': '.test', 'delete': False}

def test_default_filename() -> None:
    old_detect_current_filename = biu.detect_current_filename
    old__no_access = biu._no_access
    old__shares_exec_prefix = biu._shares_exec_prefix

    biu.detect_current_filename = lambda: "/a/b/foo.py"

    try:
        # .py extension
        with pytest.raises(RuntimeError):
            biu.default_filename("py")

        def FALSE(_: str) -> bool:
            return False
        def TRUE(_: str) -> bool:
            return True

        # a current file, access, and no share exec
        biu._no_access = FALSE
        r = biu.default_filename("test")
        assert os.path.normpath(r) == os.path.normpath("/a/b/foo.test")

        # a current file, NO access, and no share exec
        biu._no_access = TRUE
        r = biu.default_filename("test")
        assert os.path.normpath(r) != os.path.normpath("/a/b/foo.test")
        assert r.endswith(".test")

        # a current file, access, but WITH share exec
        biu._no_access = FALSE
        biu._shares_exec_prefix = TRUE
        r = biu.default_filename("test")
        assert os.path.normpath(r) != os.path.normpath("/a/b/foo.test")
        assert r.endswith(".test")

        # no current file
        biu.detect_current_filename = lambda: None
        biu._no_access = FALSE
        biu._shares_exec_prefix = FALSE
        r = biu.default_filename("test")
        assert os.path.normpath(r) != os.path.normpath("/a/b/foo.test")
        assert r.endswith(".test")

    finally:
        biu.detect_current_filename = old_detect_current_filename
        biu._no_access = old__no_access
        biu._shares_exec_prefix = old__shares_exec_prefix

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

@patch('os.access')
def test__no_access(mock_access: MagicMock) -> None:
    biu._no_access("test")
    assert mock_access.called
    assert mock_access.call_args[0] == ("test", os.W_OK | os.X_OK)
    assert mock_access.call_args[1] == {}

def test__shares_exec_prefix() -> None:
    import sys
    old_ex = sys.exec_prefix
    try:
        sys.exec_prefix = "/foo/bar"
        assert biu._shares_exec_prefix("/foo/bar") is True
        sys.exec_prefix = "/baz/bar"
        assert biu._shares_exec_prefix("/foo/bar") is False
        sys.exec_prefix = None
        assert biu._shares_exec_prefix("/foo/bar") is False
    finally:
        sys.exec_prefix = old_ex

def test__resized_restores_after_exception() -> None:
    plot = Plot(width=100, height=200)

    with pytest.raises(RuntimeError):  # noqa: PT012  (the raise is the point: it proves the context manager unwinds)
        with biu._resized(plot, width=300, height=400):
            assert plot.width == 300
            assert plot.height == 400
            raise RuntimeError("boom")

    assert plot.width == 100
    assert plot.height == 200

def test_get_layout_html_uses_source_or_curdoc_theme_by_default() -> None:
    plot = Plot()

    with patch("bokeh.io.util.embed") as mock_embed:
        mock_embed.return_value.page.return_value = "<html></html>"
        assert biu.get_layout_html(plot) == "<html></html>"

    mock_embed.assert_called_once_with(
        plot, theme=ThemePolicy.SOURCE_OR_CURDOC, callback_policy="suppress",
    )
    mock_embed.return_value.page.assert_called_once_with(resources=ANY, title="", template=ANY)


def test_get_layout_html_preserves_external_extension_dependencies(monkeypatch: pytest.MonkeyPatch) -> None:
    from bokeh.embed import embed
    from bokeh.models import Div
    from bokeh.resources import ResourceConflictError

    monkeypatch.setattr(Div, "__javascript__", ["https://example.test/extension.js"], raising=False)
    monkeypatch.setattr(Div, "__css__", ["https://example.test/extension.css"], raising=False)
    plot = Div(text="External extension")

    with pytest.raises(ResourceConflictError, match="inline resources cannot inline"):
        embed(plot).page(resources="inline")
    html = biu.get_layout_html(plot)

    assert '<script src="https://example.test/extension.js"' in html
    assert '<link rel="stylesheet" href="https://example.test/extension.css"' in html
    assert 'src="https://cdn.bokeh.org' not in html

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
