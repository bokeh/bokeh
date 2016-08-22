from __future__ import absolute_import, print_function

import unittest

from bokeh.application.handlers import FunctionHandler
from bokeh.document import Document

from bokeh.model import Model
from bokeh.core.properties import Int, Instance

class AnotherModelInTestFunction(Model):
    bar = Int(1)

class SomeModelInTestFunction(Model):
    foo = Int(2)
    child = Instance(Model)

class TestFunctionHandler(unittest.TestCase):

    def test_empty_func(self):
        def noop(doc):
            pass
        handler = FunctionHandler(noop)
        doc = Document()
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert not doc.roots

    def test_func_adds_roots(self):
        def add_roots(doc):
            doc.add_root(AnotherModelInTestFunction())
            doc.add_root(SomeModelInTestFunction())
        handler = FunctionHandler(add_roots)
        doc = Document()
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert len(doc.roots) == 2

    def test_safe_to_fork(self):
        def noop(doc):
            pass
        handler = FunctionHandler(noop)
        doc = Document()
        assert handler.safe_to_fork
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert not handler.safe_to_fork
