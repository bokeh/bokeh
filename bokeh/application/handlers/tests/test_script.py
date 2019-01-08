#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.document import Document
from bokeh._testing.util.filesystem import with_file_contents

# Module under test
import bokeh.application.handlers.script as bahs

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_ScriptHandler(object):

    # Public methods ----------------------------------------------------------

    def test_runner_uses_source_from_filename(self):
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

    def test_runner_script_with_encoding(self):
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

    def test_missing_filename_raises(self):
        with pytest.raises(ValueError):
            bahs.ScriptHandler()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
