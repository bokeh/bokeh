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

# External imports
import nbformat

# Bokeh imports
from bokeh.document import Document
from bokeh.util.testing import with_temporary_file

# Module under test
import bokeh.application.handlers.notebook as bahn

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

        ( 'NotebookHandler', (1,0,0) ),

    ), DEV: (

    )

}

Test_api = verify_api(bahn, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

def with_script_contents(contents, func):
    def with_file_object(f):
        nbsource = nbformat.writes(contents)
        f.write(nbsource.encode("UTF-8"))
        f.flush()
        func(f.name)
    with_temporary_file(with_file_object)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_NotebookHandler(object):

    def test_runner_uses_source_from_filename(self):
        doc = Document()
        source = nbformat.v4.new_notebook()
        result = {}
        def load(filename):
            handler = bahn.NotebookHandler(filename=filename)
            handler.modify_document(doc)
            result['handler'] = handler
            result['filename'] = filename
        with_script_contents(source, load)

        assert result['handler']._runner.path == result['filename']
        assert result['handler']._runner.source == "\n# coding: utf-8\n"
        assert not doc.roots

    def test_missing_filename_raises(self):
        with pytest.raises(ValueError):
            bahn.NotebookHandler()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
