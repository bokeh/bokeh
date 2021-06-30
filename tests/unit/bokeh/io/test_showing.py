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

# External imports
from mock import MagicMock, Mock, patch

# Bokeh imports
from bokeh.application.application import Application
from bokeh.io.doc import curdoc
from bokeh.io.output import output_notebook
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
    default_kwargs = dict(browser=None, new="tab", notebook_handle=False)
    p = Plot()
    bis.show(p, **default_kwargs)
    assert mock__show_with_state.call_count == 1
    assert mock__show_with_state.call_args[0] == (p, curstate(), None, "tab")
    assert mock__show_with_state.call_args[1] == {'notebook_handle': False}
    assert curdoc().roots == []

@patch('bokeh.io.showing._show_with_state')
def test_show_with_explicit_args(mock__show_with_state: MagicMock) -> None:
    curstate().reset()
    kwargs = dict(browser="browser", new="new", notebook_handle=True)
    p = Plot()
    bis.show(p, **kwargs)
    assert mock__show_with_state.call_count == 1
    assert mock__show_with_state.call_args[0] == (p, curstate(), "browser", "new")
    assert mock__show_with_state.call_args[1] == {'notebook_handle': True}
    assert curdoc().roots == []

@patch('bokeh.io.showing.run_notebook_hook')
def test_show_with_app(mock_run_notebook_hook: MagicMock, ipython) -> None:
    curstate().reset()
    app = Application()
    output_notebook()
    bis.show(app, notebook_url="baz")
    assert curstate().notebook_type == "jupyter"
    assert mock_run_notebook_hook.call_count == 1
    assert mock_run_notebook_hook.call_args[0][0] == curstate().notebook_type
    assert mock_run_notebook_hook.call_args[0][1:] == ("app", app, curstate(), "baz")
    assert mock_run_notebook_hook.call_args[1] == {}

@patch('bokeh.io.showing._show_with_state')
def test_show_doesn_not_adds_obj_to_curdoc(m) -> None:
    curstate().reset()
    assert curstate().document.roots == []
    p = Plot()
    bis.show(p)
    assert curstate().document.roots == []
    p = Plot()
    bis.show(p)
    assert curstate().document.roots == []

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

@patch('bokeh.io.showing.run_notebook_hook')
@patch('bokeh.io.showing._show_file_with_state')
@patch('bokeh.io.showing.get_browser_controller')
def test__show_with_state_with_notebook(
        mock_get_browser_controller: MagicMock,
        mock__show_file_with_state: MagicMock,
        mock_run_notebook_hook: MagicMock) -> None:
    mock_get_browser_controller.return_value = "controller"
    s = State()

    p = Plot()

    s.output_notebook()
    bis._show_with_state(p, s, "browser", "new")
    assert s.notebook_type == "jupyter"

    assert mock_run_notebook_hook.call_count == 1
    assert mock_run_notebook_hook.call_args[0] == ("jupyter", "doc", p, s, False)
    assert mock_run_notebook_hook.call_args[1] == {}

    assert mock__show_file_with_state.call_count == 0

    s.output_file("foo.html")
    bis._show_with_state(p, s, "browser", "new")
    assert s.notebook_type == "jupyter"

    assert mock_run_notebook_hook.call_count == 2
    assert mock_run_notebook_hook.call_args[0] == ("jupyter", "doc", p, s, False)
    assert mock_run_notebook_hook.call_args[1] == {}

    assert mock__show_file_with_state.call_count == 1
    assert mock__show_file_with_state.call_args[0] == (p, s, "new", "controller")
    assert mock__show_file_with_state.call_args[1] == {}

@patch('bokeh.io.notebook.get_comms')
@patch('bokeh.io.notebook.show_doc')
@patch('bokeh.io.showing._show_file_with_state')
@patch('bokeh.io.showing.get_browser_controller')
def test__show_with_state_with_no_notebook(
        mock_get_browser_controller: MagicMock,
        mock__show_file_with_state: MagicMock,
        mock_show_doc: MagicMock,
        mock_get_comms: MagicMock):
    mock_get_browser_controller.return_value = "controller"
    mock_get_comms.return_value = "comms"
    s = State()

    s.output_file("foo.html")
    bis._show_with_state("obj", s, "browser", "new")
    assert s.notebook_type == None

    assert mock_show_doc.call_count == 0

    assert mock__show_file_with_state.call_count == 1
    assert mock__show_file_with_state.call_args[0] == ("obj", s, "new", "controller")
    assert mock__show_file_with_state.call_args[1] == {}

@patch('os.path.abspath')
@patch('bokeh.io.showing.save')
def test(mock_save: MagicMock, mock_abspath: MagicMock):
    controller = Mock()
    mock_save.return_value = "savepath"

    s = State()
    s.output_file("foo.html")

    bis._show_file_with_state("obj", s, "window", controller)

    assert mock_save.call_count == 1
    assert mock_save.call_args[0] == ("obj",)
    assert mock_save.call_args[1] == {"state": s}

    assert controller.open.call_count == 1
    assert controller.open.call_args[0] == ("file://savepath",)
    assert controller.open.call_args[1] == {"new": 1}

    bis._show_file_with_state("obj", s, "tab", controller)

    assert mock_save.call_count == 2
    assert mock_save.call_args[0] == ("obj",)
    assert mock_save.call_args[1] == {"state": s}

    assert controller.open.call_count == 2
    assert controller.open.call_args[0] == ("file://savepath",)
    assert controller.open.call_args[1] == {"new": 2}

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
