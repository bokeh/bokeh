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
import inspect
from unittest.mock import MagicMock, Mock, patch

# Bokeh imports
from bokeh.application.application import Application
from bokeh.io.doc import curdoc
from bokeh.io.state import State, curstate
from bokeh.models import ColumnDataSource, GlyphRenderer, Plot

# Module under test
import bokeh.io.showing as bis # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@patch('bokeh.io.showing._show_with_state')
def test_show_with_default_args(mock__show_with_state: MagicMock) -> None:
    curstate().reset()
    p = Plot()
    bis.show(p)
    assert mock__show_with_state.call_count == 1
    assert mock__show_with_state.call_args[0] == (p, curstate())
    assert mock__show_with_state.call_args[1] == {}
    assert curdoc().roots == []

def test_show_with_app(ipython) -> None:
    curstate().reset()
    app = Application()
    with pytest.raises(RuntimeError, match=r"app = serve.*show\(app\)"):
        bis.show(app)

def test_show_rejects_live_option() -> None:
    curstate().reset()
    with pytest.raises(ValueError, match=r"Unexpected show\(\) options for a standalone object: live"):
        bis.show(Plot(), live=True)

def test_show_rejects_removed_file_options() -> None:
    parameters = inspect.signature(bis.show).parameters
    assert "browser" not in parameters
    assert "new" not in parameters
    with pytest.raises(ValueError, match=r"Unexpected show.*browser"):
        bis.show(Plot(), browser="firefox")
    with pytest.raises(ValueError, match=r"Unexpected show.*new"):
        bis.show(Plot(), new="window")

def test_show_rejects_removed_notebook_handle() -> None:
    parameters = inspect.signature(bis.show).parameters
    assert "notebook_handle" not in parameters
    assert "notebook_url" not in parameters
    with pytest.raises(ValueError, match=r"Unexpected show.*notebook_handle"):
        bis.show(Plot(), notebook_handle=True)

def test_show_rejects_removed_notebook_url() -> None:
    with pytest.raises(ValueError, match=r"Unexpected show.*notebook_url"):
        bis.show(Plot(), notebook_url="https://example.test")

def test_show_rejects_live_option_for_app(ipython) -> None:
    curstate().reset()
    from bokeh.io.jupyter_app import NotebookApplication
    app = object.__new__(NotebookApplication)
    with patch('bokeh.io.notebook.notebook_environment', return_value=True):
        with pytest.raises(ValueError, match=r"Unexpected show\(\) options for a managed notebook application: live"):
            bis.show(app, live=True)

def test_show_rejects_notebook_url_for_app(ipython) -> None:
    curstate().reset()
    from bokeh.io.jupyter_app import NotebookApplication
    app = object.__new__(NotebookApplication)
    with patch('bokeh.io.notebook.notebook_environment', return_value=True):
        with pytest.raises(ValueError, match=r"Unexpected show\(\) options for a managed notebook application: notebook_url"):
            bis.show(app, notebook_url="https://example.test")

def test_show_rejects_unknown_standalone_options() -> None:
    with pytest.raises(ValueError, match=r"Unexpected show.*made_up"):
        bis.show(Plot(), made_up=True)

@patch('bokeh.io.showing._show_with_state')
def test_show_does_not_adds_obj_to_curdoc(m) -> None:
    curstate().reset()
    assert curstate().document.roots == []
    p = Plot()
    bis.show(p)
    assert curstate().document.roots == []
    p = Plot()
    bis.show(p)
    assert curstate().document.roots == []

@patch('bokeh.io.showing._show_with_state')
def test_show_with_multiple_objects(m) -> None:
    obj0 = Plot()
    obj1 = Plot()
    bis.show([])
    bis.show([obj0])
    bis.show([obj0, obj1])

@pytest.mark.parametrize('obj', [1, 2.3, None, "str", GlyphRenderer(data_source=ColumnDataSource())])
def test_show_with_bad_object(obj) -> None:
    with pytest.raises(ValueError):
        bis.show(obj)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

@patch('bokeh.io.showing.show_doc')
@patch('bokeh.io.showing._show_file_with_state')
@patch('bokeh.io.showing.get_browser_controller')
def test__show_with_state_with_notebook(
        mock_get_browser_controller: MagicMock,
        mock__show_file_with_state: MagicMock,
        mock_show_doc: MagicMock) -> None:
    s = State()

    p = Plot()

    with patch("bokeh.io.notebook.notebook_environment", return_value=True):
        bis._show_with_state(p, s)

    assert mock_show_doc.call_count == 1
    assert mock_show_doc.call_args.args == (p, s)
    assert mock_show_doc.call_args.kwargs == {}

    assert mock__show_file_with_state.call_count == 0

    s.output_file("foo.html")
    with patch("bokeh.io.notebook.notebook_environment", return_value=True):
        bis._show_with_state(p, s)

    assert mock_show_doc.call_count == 2
    assert mock_show_doc.call_args.args == (p, s)
    assert mock_show_doc.call_args.kwargs == {}

    assert mock__show_file_with_state.call_count == 0
    assert mock_get_browser_controller.call_count == 0

@patch('bokeh.io.showing.show_doc')
@patch('bokeh.io.showing._show_file_with_state')
@patch('bokeh.io.showing.get_browser_controller')
def test__show_with_state_with_no_notebook(
        mock_get_browser_controller: MagicMock,
        mock__show_file_with_state: MagicMock,
        mock_show_doc: MagicMock):
    mock_get_browser_controller.return_value = "controller"
    s = State()

    s.output_file("foo.html")
    bis._show_with_state("obj", s)

    assert mock_show_doc.call_count == 0

    assert mock__show_file_with_state.call_count == 1
    assert mock__show_file_with_state.call_args[0] == ("obj", s, "controller")
    assert mock__show_file_with_state.call_args[1] == {}

@patch('os.path.abspath')
@patch('bokeh.io.showing.save')
def test(mock_save: MagicMock, mock_abspath: MagicMock):
    controller = Mock()
    mock_save.return_value = "savepath"

    s = State()
    s.output_file("foo.html")

    bis._show_file_with_state("obj", s, controller)

    assert mock_save.call_count == 1
    assert mock_save.call_args[0] == ("obj",)
    assert mock_save.call_args[1] == {"state": s}

    assert controller.open.call_count == 1
    assert controller.open.call_args[0] == ("file://savepath",)
    assert controller.open.call_args[1] == {"new": 2}

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
