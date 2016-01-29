from __future__ import absolute_import, print_function

import unittest

from bokeh.application.handlers import CodeHandler
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
        f.write(contents.encode("UTF-8"))
        f.flush()
        func(f.name)
    _with_temp_file(with_file_object)

script_adds_two_roots = """
from bokeh.io import curdoc
from bokeh.model import Model
from bokeh.core.properties import Int, Instance

class AnotherModelInTestScript(Model):
    bar = Int(1)

class SomeModelInTestScript(Model):
    foo = Int(2)
    child = Instance(Model)

curdoc().add_root(AnotherModelInTestScript())
curdoc().add_root(SomeModelInTestScript())
"""

class TestCodeHandler(unittest.TestCase):

    def test_empty_script(self):
        doc = Document()
        handler = CodeHandler("# This script does nothing", "test_filename")
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

        assert not doc.roots

    def test_script_adds_roots(self):
        doc = Document()
        handler = CodeHandler(script_adds_two_roots, "test_filename")
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

        assert len(doc.roots) == 2

    def test_script_bad_syntax(self):
        doc = Document()
        handler = CodeHandler("This is a syntax error", "test_filename")
        handler.modify_document(doc)

        assert handler.error is not None
        assert 'Invalid syntax' in handler.error

    def test_script_runtime_error(self):
        doc = Document()
        handler = CodeHandler("raise RuntimeError('nope')", "test_filename")
        handler.modify_document(doc)

        assert handler.error is not None
        assert 'nope' in handler.error
