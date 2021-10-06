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

# Bokeh imports
from bokeh._testing.util.filesystem import with_file_contents
from bokeh.document import Document

# Module under test
import bokeh.application.handlers.script as bahs # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class Test_ScriptHandler:
    # Public methods ----------------------------------------------------------

    def test_runner_uses_source_from_filename(self) -> None:
        doc = Document()
        source = "# Test contents for script"
        result = {}
        def load(filename):
            handler = bahs.ScriptHandler(filename=filename)
            handler.modify_document(doc)
            result['handler'] = handler
            result['filename'] = filename
        with_file_contents(source, load)

        assert result['handler']._runner.path == result['filename']
        assert result['handler']._runner.source == source
        assert not doc.roots

    def test_runner_script_with_encoding(self) -> None:
        doc = Document()
        source = "# -*- coding: utf-8 -*-\nimport os"
        result = {}
        def load(filename):
            handler = bahs.ScriptHandler(filename=filename)
            handler.modify_document(doc)
            result['handler'] = handler
            result['filename'] = filename
        with_file_contents(source, load)

        assert result['handler'].error is None
        assert result['handler'].failed is False
        assert not doc.roots

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
