#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

from mock import patch

from bokeh.document import Document
from bokeh.resources import DEFAULT_SERVER_HTTP_URL

import bokeh.core.state as state

GENERATED_SESSION_ID_LEN = 44

def test_creation():
    s = state.State()
    assert isinstance(s.document, Document)
    assert s.url == "http://localhost:5006/"
    assert s.file == None
    assert s.notebook == False
    assert s.server_enabled == False
    assert GENERATED_SESSION_ID_LEN == len(s.session_id)

def test_default_file_resources():
    s = state.State()
    s.output_file("foo.html")
    assert s.file['resources'].minified, True

def test_output_file():
    s = state.State()
    s.output_file("foo.html")
    assert s.file['filename'] == "foo.html"
    assert s.file['title'] == "Bokeh Plot"
    assert s.file['resources'].log_level == 'info'
    assert s.file['resources'].minified == True

@patch('bokeh.core.state.logger')
@patch('os.path.isfile')
def test_output_file_file_exists(mock_isfile, mock_logger):
    mock_isfile.return_value = True
    s = state.State()
    s.output_file("foo.html")
    assert s.file['filename'] == "foo.html"
    assert s.file['title'] == "Bokeh Plot"
    assert s.file['resources'].log_level == 'info'
    assert s.file['resources'].minified == True
    assert state.logger.info.called
    assert state.logger.info.call_args[0] == (
        "Session output file 'foo.html' already exists, will be overwritten.",
    )

def test_output_notebook_noarg():
    s = state.State()
    s.output_notebook()
    assert GENERATED_SESSION_ID_LEN == len(s.session_id)
    assert s.notebook == True

def test_output_server():
    s = state.State()
    assert GENERATED_SESSION_ID_LEN == len(s.session_id)
    assert s.server_enabled == False
    s.output_server()
    assert s.session_id == "default"
    assert s.session_id_allowing_none =="default"
    assert s.server_url + "/" == DEFAULT_SERVER_HTTP_URL
    assert s.app_path == '/'
    assert s.server_enabled == True
    s.output_server("foo")
    assert s.session_id == "foo"
    assert s.session_id_allowing_none =="foo"
    assert s.server_url + "/" == DEFAULT_SERVER_HTTP_URL
    assert s.app_path == '/'
    assert s.server_enabled == True

def test_reset():
    s = state.State()
    d = s.document
    s.output_file("foo.html")
    s.output_server("default")
    s.output_notebook()
    s.reset()
    assert s.file == None
    assert s.notebook == False
    assert s.server_enabled == False
    assert GENERATED_SESSION_ID_LEN == len(s.session_id)
    assert isinstance(s.document, Document)
    assert s.document != d

def test_doc_set():
    s = state.State()
    d = Document()
    s.document = d
    assert isinstance(s.document, Document)
    assert s.document == d
