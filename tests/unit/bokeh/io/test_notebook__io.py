#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
import json
from typing import Any, Set

# External imports
from mock import MagicMock, PropertyMock, patch

# Bokeh imports
from bokeh.document.document import Document
from bokeh.io.state import State

# Module under test
import bokeh.io.notebook as binb # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_install_notebook_hook() -> None:
    binb.install_notebook_hook("foo", "load", "doc", "app")
    assert binb._HOOKS["foo"]['load'] == "load"
    assert binb._HOOKS["foo"]['doc'] == "doc"
    assert binb._HOOKS["foo"]['app'] == "app"
    with pytest.raises(RuntimeError):
        binb.install_notebook_hook("foo", "load2", "doc2", "app2")
    binb.install_notebook_hook("foo", "load2", "doc2", "app2", overwrite=True)
    assert binb._HOOKS["foo"]['load'] == "load2"
    assert binb._HOOKS["foo"]['doc'] == "doc2"
    assert binb._HOOKS["foo"]['app'] == "app2"

@patch('bokeh.io.notebook.get_comms')
@patch('bokeh.io.notebook.publish_display_data')
@patch('bokeh.embed.notebook.notebook_content')
def test_show_doc_no_server(mock_notebook_content: MagicMock,
                            mock__publish_display_data: MagicMock,
                            mock_get_comms: MagicMock) -> None:
    mock_get_comms.return_value = "comms"
    s = State()
    d = Document()
    mock_notebook_content.return_value = ["notebook_script", "notebook_div", d]

    class Obj:
        id = None
        def references(self) -> Set[Any]:
            return set()

    assert mock__publish_display_data.call_count == 0
    binb.show_doc(Obj(), s, True)

    expected_args = ({'application/javascript': 'notebook_script', 'application/vnd.bokehjs_exec.v0+json': ''},)
    expected_kwargs = {'metadata': {'application/vnd.bokehjs_exec.v0+json': {'id': None}}}

    assert d.callbacks._hold is not None
    assert mock__publish_display_data.call_count == 2 # two mime types
    assert mock__publish_display_data.call_args[0] == expected_args
    assert mock__publish_display_data.call_args[1] == expected_kwargs


class Test_push_notebook:
    @patch('bokeh.io.notebook.CommsHandle.comms', new_callable=PropertyMock)
    def test_no_events(self, mock_comms: PropertyMock) -> None:
        mock_comms.return_value = MagicMock()

        d = Document()

        handle = binb.CommsHandle("comms", d)
        binb.push_notebook(document=d, handle=handle)
        assert mock_comms.call_count == 0

    @patch('bokeh.io.notebook.CommsHandle.comms', new_callable=PropertyMock)
    def test_with_events(self, mock_comms: PropertyMock) -> None:
        mock_comm = MagicMock()
        mock_send = MagicMock(return_value="junk")
        mock_comm.send = mock_send
        mock_comms.return_value = mock_comm

        d = Document()

        handle = binb.CommsHandle("comms", d)
        d.title = "foo"
        binb.push_notebook(document=d, handle=handle)
        assert mock_comms.call_count > 0
        assert mock_send.call_count == 3  # sends header, metadata, then content
        assert json.loads(mock_send.call_args[0][0]) == {
            "events": [{"kind": "TitleChanged", "title": "foo"}],
            "references": [],
        }
        assert mock_send.call_args[1] == {}

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__origin_url() -> None:
    assert binb._origin_url("foo.com:8888") == "foo.com:8888"
    assert binb._origin_url("http://foo.com:8888") == "foo.com:8888"
    assert binb._origin_url("https://foo.com:8888") == "foo.com:8888"

def test__server_url() -> None:
    assert binb._server_url("foo.com:8888", 10) == "http://foo.com:10/"
    assert binb._server_url("http://foo.com:8888", 10) == "http://foo.com:10/"
    assert binb._server_url("https://foo.com:8888", 10) == "https://foo.com:10/"

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
