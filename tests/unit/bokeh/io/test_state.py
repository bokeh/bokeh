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
from mock import MagicMock, patch

# Bokeh imports
from bokeh.document import Document

# Module under test
import bokeh.io.state as bis # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_State:
    def test_creation(self) -> None:
        s = bis.State()
        assert isinstance(s.document, Document)
        assert s.file == None
        assert s.notebook == False

    def test_default_file_resources(self) -> None:
        s = bis.State()
        s.output_file("foo.html")
        assert s.file.resources.minified, True

    def test_output_file(self) -> None:
        s = bis.State()
        s.output_file("foo.html")
        assert s.file.filename == "foo.html"
        assert s.file.title == "Bokeh Plot"
        assert s.file.resources.log_level == 'info'
        assert s.file.resources.minified == True

    @patch('bokeh.io.state.log')
    @patch('os.path.isfile')
    def test_output_file_file_exists(self, mock_isfile: MagicMock, mock_log: MagicMock) -> None:
        mock_isfile.return_value = True
        s = bis.State()
        s.output_file("foo.html")
        assert s.file.filename == "foo.html"
        assert s.file.title == "Bokeh Plot"
        assert s.file.resources.log_level == 'info'
        assert s.file.resources.minified == True
        assert mock_log.info.call_count == 1
        assert mock_log.info.call_args[0] == (
            "Session output file 'foo.html' already exists, will be overwritten.",
        )

    def test_output_notebook_noarg(self) -> None:
        s = bis.State()
        s.output_notebook()
        assert s.notebook == True
        assert s.notebook_type == 'jupyter'

    def test_output_notebook_witharg(self) -> None:
        s = bis.State()
        s.output_notebook(notebook_type='notjup')
        assert s.notebook == True
        assert s.notebook_type == 'notjup'

    def test_output_invalid_notebook(self) -> None:
        s = bis.State()
        with pytest.raises(Exception):
            s.notebook_type=None
        with pytest.raises(Exception):
            s.notebook_type=10

    def test_reset(self) -> None:
        s = bis.State()
        d = s.document
        s.output_file("foo.html")
        s.output_notebook()
        s.reset()
        assert s.file == None
        assert s.notebook == False
        assert isinstance(s.document, Document)
        assert s.document != d

    def test_doc_set(self) -> None:
        s = bis.State()
        d = Document()
        s.document = d
        assert isinstance(s.document, Document)
        assert s.document == d

def test_curstate() -> None:
    cs = bis.curstate()
    assert cs is bis._STATE
    print(bis.State)
    assert isinstance(cs, bis.State)
    cs2 = bis.curstate()
    assert cs is cs2

    old_STATE = bis._STATE
    bis._STATE = None
    cs3 = bis.curstate()
    assert cs3 is bis._STATE
    assert isinstance(cs3, bis.State)
    assert cs3 is not cs2
    bis._STATE = old_STATE

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
