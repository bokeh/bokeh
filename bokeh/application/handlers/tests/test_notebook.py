from __future__ import absolute_import, print_function

import unittest

import nbformat

from bokeh.application.handlers import NotebookHandler
from bokeh.document import Document

def _with_temp_file(func):
    import tempfile
    f = tempfile.NamedTemporaryFile()
    try:
        func(f)
    finally:
        f.close()

def _with_script_contents(contents, func):
    def with_file_object(f):
        nbsource = nbformat.writes(contents)
        f.write(nbsource.encode("UTF-8"))
        f.flush()
        func(f.name)
    _with_temp_file(with_file_object)

class TestNotebookHandler(unittest.TestCase):

    def test_runner_uses_source_from_filename(self):
        doc = Document()
        source = nbformat.v4.new_notebook()
        result = {}
        def load(filename):
            handler = NotebookHandler(filename=filename)
            handler.modify_document(doc)
            result['handler'] = handler
            result['filename'] = filename
        _with_script_contents(source, load)

        assert result['handler']._runner.path == result['filename']
        assert result['handler']._runner.source == "\n# coding: utf-8\n"
        assert not doc.roots
