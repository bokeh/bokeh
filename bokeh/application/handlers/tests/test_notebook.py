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
from packaging import version
import nbformat
import nbconvert

# Bokeh imports
from bokeh.document import Document
from bokeh._testing.util.filesystem import with_temporary_file

# Module under test
import bokeh.application.handlers.notebook as bahn

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def with_script_contents(contents, func):
    def with_file_object(f):
        nbsource = nbformat.writes(contents)
        f.write(nbsource.encode("UTF-8"))
        f.flush()
        func(f.name)
    with_temporary_file(with_file_object)

class Test_NotebookHandler(object):

    # Public methods ----------------------------------------------------------

    def test_runner_strips_line_magics(self, ipython):
        doc = Document()
        source = nbformat.v4.new_notebook()
        source.cells.append(nbformat.v4.new_code_cell('%time'))
        def load(filename):
            handler = bahn.NotebookHandler(filename=filename)
            handler.modify_document(doc)
            assert handler._runner.failed == False

        with_script_contents(source, load)

    def test_runner_strips_cell_magics(self):
        doc = Document()
        source = nbformat.v4.new_notebook()
        code = '%%timeit\n1+1'
        source.cells.append(nbformat.v4.new_code_cell(code))
        def load(filename):
            handler = bahn.NotebookHandler(filename=filename)
            handler.modify_document(doc)
            assert handler._runner.failed == False

        with_script_contents(source, load)

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
        if version.parse(nbconvert.__version__) < version.parse("5.4"):
            expected_source = "\n# coding: utf-8\n"
        else:
            expected_source = "#!/usr/bin/env python\n# coding: utf-8\n"

        assert result['handler']._runner.source == expected_source
        assert not doc.roots

    def test_missing_filename_raises(self):
        with pytest.raises(ValueError):
            bahn.NotebookHandler()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
