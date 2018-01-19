#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

from bokeh.util.api import DEV, GENERAL ; DEV, GENERAL
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json
from mock import MagicMock, patch, PropertyMock

# External imports

# Bokeh imports
from bokeh.document.document import Document
from bokeh.io.state import State

# Module under test
import bokeh.io.notebook as binb

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

        ( 'CommsHandle',           (1, 0, 0) ),
        ( 'install_notebook_hook', (1, 0, 0) ),
        ( 'push_notebook',         (1, 0, 0) ),
        ( 'run_notebook_hook',     (1, 0, 0) ),

    ), DEV: (

        ( 'CommsHandle.comms.fget', (1, 0, 0) ),
        ( 'CommsHandle.doc.fget',   (1, 0, 0) ),
        ( 'destroy_server',         (1, 0, 0) ),
        ( 'get_comms',              (1, 0, 0) ),
        ( 'install_jupyter_hooks',  (1, 0, 0) ),
        ( 'load_notebook',          (1, 0, 0) ),
        ( 'publish_display_data',   (1, 0, 0) ),
        ( 'show_app',               (1, 0, 0) ),
        ( 'show_doc',               (1, 0, 0) ),

    )

}

Test_api = verify_api(binb, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_install_notebook_hook():
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
def test_show_doc_no_server(mock_notebook_content,
                            mock__publish_display_data,
                            mock_get_comms):
    mock_get_comms.return_value = "comms"
    s = State()
    d = Document()
    mock_notebook_content.return_value = ["notebook_script", "notebook_div", d]

    class Obj(object):
        _id = None

    assert mock__publish_display_data.call_count == 0
    binb.show_doc(Obj(), s, True)

    expected_args = ({'application/javascript': 'notebook_script', 'application/vnd.bokehjs_exec.v0+json': ''},)
    expected_kwargs = {'metadata': {'application/vnd.bokehjs_exec.v0+json': {'id': None}}}

    assert d._hold is not None
    assert mock__publish_display_data.call_count == 2 # two mime types
    assert mock__publish_display_data.call_args[0] == expected_args
    assert mock__publish_display_data.call_args[1] == expected_kwargs

class Test_push_notebook(object):

    @patch('bokeh.io.notebook.CommsHandle.comms', new_callable=PropertyMock)
    def test_no_events(self, mock_comms):
        mock_comms.return_value = MagicMock()

        d = Document()

        handle = binb.CommsHandle("comms", d)
        binb.push_notebook(d, None, handle)
        assert mock_comms.call_count == 0

    @patch('bokeh.io.notebook.CommsHandle.comms', new_callable=PropertyMock)
    def test_with_events(self, mock_comms):
        mock_comm = MagicMock()
        mock_send = MagicMock(return_value="junk")
        mock_comm.send = mock_send
        mock_comms.return_value = mock_comm

        d = Document()

        handle = binb.CommsHandle("comms", d)
        d.title = "foo"
        binb.push_notebook(d, None, handle)
        assert mock_comms.call_count > 0
        assert mock_send.call_count == 3 # sends header, metadata, then content
        assert json.loads(mock_send.call_args[0][0]) == {u"events": [{u"kind": u"TitleChanged", u"title": u"foo"}], u"references": []}
        assert mock_send.call_args[1] == {}

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__origin_url():
    assert binb._origin_url("foo.com:8888") == "foo.com:8888"
    assert binb._origin_url("http://foo.com:8888") == "foo.com:8888"
    assert binb._origin_url("https://foo.com:8888") == "foo.com:8888"

def test__server_url():
    assert binb._server_url("foo.com:8888", 10) == "http://foo.com:10/"
    assert binb._server_url("http://foo.com:8888", 10) == "http://foo.com:10/"
    assert binb._server_url("https://foo.com:8888", 10) == "https://foo.com:10/"
