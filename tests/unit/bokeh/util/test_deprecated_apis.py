#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import sys
from collections.abc import Callable
from typing import Any

import pytest

from bokeh.embed import components, file_html, server_document, server_session
from bokeh.models import ActionItem, CheckableItem, ColorMap, Div
from bokeh.plotting import figure
from bokeh.plotting.glyph_api import GlyphAPI
from bokeh.settings import settings
from bokeh.util.paths import bokehjsdir, serverdir


@pytest.mark.parametrize(("api", "args", "kwargs", "version", "replacement"), [
    (components, (Div(),), {}, "4.0.0", "embed(...).fragment(...)"),
    (file_html, (Div(),), {"resources": "cdn"}, "4.0.0", "embed(...).page(...)"),
    (server_document, (), {}, "4.0.0", "embed_server(...).fragment(...).html"),
    (server_session, (), {"session_id": "test"}, "4.0.0", "embed_server(session_id=...).fragment(...).html"),
    (ColorMap, (), {}, "3.4.0", "PaletteSelect"),
    (ActionItem, (), {}, "3.7.0", "MenuItem"),
    (CheckableItem, (), {}, "3.7.0", "MenuItem with checked=True or checked=False"),
    (serverdir, (), {}, "3.4.0", "server_path()"),
    (bokehjsdir, (), {}, "3.4.0", "bokehjs_path()"),
    (settings.bokehjsdir, (), {}, "3.4.0", "bokehjs_path()"),
])
def test_deprecated_api_warning(
    api: Callable[..., Any], args: tuple[Any, ...], kwargs: dict[str, Any], version: str, replacement: str,
) -> None:
    with pytest.warns(DeprecationWarning) as warnings:
        line = sys._getframe().f_lineno + 1
        api(*args, **kwargs)

    assert len(warnings) == 1
    warning = warnings[0]
    assert warning.filename == __file__
    assert warning.lineno == line
    assert f"deprecated in Bokeh {version}" in str(warning.message)
    assert replacement in str(warning.message)
    assert api.__deprecated__ == str(warning.message)


MARKER_METHODS = [
    name for name, method in vars(GlyphAPI).items()
    if callable(method) and hasattr(method, "__deprecated__")
]


@pytest.mark.parametrize("marker", MARKER_METHODS)
def test_legacy_marker_warning(marker: str) -> None:
    plot = figure()
    with pytest.warns(DeprecationWarning) as warnings:
        line = sys._getframe().f_lineno + 1
        renderer = getattr(plot, marker)([1], [2])

    assert len(warnings) == 1
    assert warnings[0].filename == __file__
    assert warnings[0].lineno == line
    assert "deprecated in Bokeh 3.4.0" in str(warnings[0].message)
    assert f"scatter(marker={marker!r}, ...)" in str(warnings[0].message)
    assert renderer.glyph.marker == marker


def test_only_legacy_markers_deprecated() -> None:
    assert len(MARKER_METHODS) == 27
    assert not hasattr(GlyphAPI.circle, "__deprecated__")
    assert not hasattr(GlyphAPI.scatter, "__deprecated__")
