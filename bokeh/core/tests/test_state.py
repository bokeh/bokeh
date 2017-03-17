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

import bokeh.core.state as state

def test_creation():
    s = state.State()
    assert isinstance(s.document, Document)
    assert s.file == None
    assert s.notebook == False
    assert s.watching_cells == False

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
    assert s.notebook == True

def test_reset():
    s = state.State()
    d = s.document
    s.output_file("foo.html")
    s.output_notebook()
    s.reset()
    assert s.file == None
    assert s.notebook == False
    assert isinstance(s.document, Document)
    assert s.document != d

def test_doc_set():
    s = state.State()
    d = Document()
    s.document = d
    assert isinstance(s.document, Document)
    assert s.document == d
