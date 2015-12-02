from __future__ import absolute_import, print_function

import unittest

from bokeh.application.handlers import FunctionHandler
from bokeh.application import Application
from bokeh.model import Model
from bokeh.properties import Int, Instance

class AnotherModelInTestApplication(Model):
    bar = Int(1)

class SomeModelInTestApplication(Model):
    foo = Int(2)
    child = Instance(Model)

class TestApplication(unittest.TestCase):

    def test_empty(self):
        a = Application()
        doc = a.create_document()
        assert not doc.roots

    def test_one_handler(self):
        a = Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        handler = FunctionHandler(add_roots)
        a.add(handler)
        doc = a.create_document()
        assert len(doc.roots) == 2

    def test_two_handlers(self):
        a = Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        def add_one_root(doc):
            doc.add_root(AnotherModelInTestApplication())
        handler = FunctionHandler(add_roots)
        a.add(handler)
        handler2 = FunctionHandler(add_one_root)
        a.add(handler2)
        doc = a.create_document()
        assert len(doc.roots) == 3
