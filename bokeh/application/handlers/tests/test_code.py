from __future__ import absolute_import, print_function

import unittest

from bokeh.application.handlers import CodeHandler
from bokeh.document import Document

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
        handler = CodeHandler(source="# This script does nothing", filename="path/to/test_filename")
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

        assert not doc.roots

    def test_script_adds_roots(self):
        doc = Document()
        handler = CodeHandler(source=script_adds_two_roots, filename="path/to/test_filename")
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

        assert len(doc.roots) == 2

    def test_script_bad_syntax(self):
        doc = Document()
        handler = CodeHandler(source="This is a syntax error", filename="path/to/test_filename")
        handler.modify_document(doc)

        assert handler.error is not None
        assert 'Invalid syntax' in handler.error

    def test_script_runtime_error(self):
        doc = Document()
        handler = CodeHandler(source="raise RuntimeError('nope')", filename="path/to/test_filename")
        handler.modify_document(doc)

        assert handler.error is not None
        assert 'nope' in handler.error

    def test_script_sys_path(self):
        doc = Document()
        handler = CodeHandler(source="""import sys; raise RuntimeError("path: '%s'" % sys.path[0])""", filename="path/to/test_filename")
        handler.modify_document(doc)

        assert handler.error is not None
        assert "path: 'path/to'" in handler.error

    def test_script_argv(self):
        doc = Document()
        handler = CodeHandler(source="""import sys; raise RuntimeError("argv: %r" % sys.argv)""", filename="path/to/test_filename")
        handler.modify_document(doc)

        assert handler.error is not None
        assert "argv: ['test_filename']" in handler.error

        doc = Document()
        handler = CodeHandler(source="""import sys; raise RuntimeError("argv: %r" % sys.argv)""", filename="path/to/test_filename", argv=[10, 20, 30])
        handler.modify_document(doc)

        assert handler.error is not None
        assert "argv: ['test_filename', 10, 20, 30]" in handler.error

    def test_safe_to_fork(self):
        doc = Document()
        handler = CodeHandler(source="# This script does nothing", filename="path/to/test_filename")
        assert handler.safe_to_fork
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert not handler.safe_to_fork
