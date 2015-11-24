from __future__ import absolute_import, print_function

import unittest

from bokeh.application.handlers import ScriptHandler
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
from bokeh.properties import Int, Instance

class AnotherModelInTestScript(Model):
    bar = Int(1)

class SomeModelInTestScript(Model):
    foo = Int(2)
    child = Instance(Model)

curdoc().add_root(AnotherModelInTestScript())
curdoc().add_root(SomeModelInTestScript())
"""

class TestScriptHandler(unittest.TestCase):

    def test_empty_script(self):
        doc = Document()
        def load(filename):
            handler = ScriptHandler(filename=filename)
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)
        _with_script_contents("# This script does nothing", load)

        assert not doc.roots

    def test_script_adds_roots(self):
        doc = Document()
        def load(filename):
            handler = ScriptHandler(filename=filename)
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)
        _with_script_contents(script_adds_two_roots, load)

        assert len(doc.roots) == 2

    def test_script_bad_syntax(self):
        doc = Document()
        result = {}
        def load(filename):
            handler = ScriptHandler(filename=filename)
            result['handler'] = handler
            handler.modify_document(doc)
        _with_script_contents("This is a syntax error", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'Invalid syntax' in handler.error

    def test_script_runtime_error(self):
        doc = Document()
        result = {}
        def load(filename):
            handler = ScriptHandler(filename=filename)
            result['handler'] = handler
            handler.modify_document(doc)
        _with_script_contents("raise RuntimeError('nope')", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'nope' in handler.error
