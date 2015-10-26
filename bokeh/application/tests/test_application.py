from __future__ import absolute_import, print_function

import unittest

from bokeh.application.spellings import FunctionHandler
from bokeh.application import Application
from bokeh.document import Document
from bokeh.plot_object import PlotObject
from bokeh.properties import Int, Instance

class AnotherModel(PlotObject):
    bar = Int(1)

class SomeModel(PlotObject):
    foo = Int(2)
    child = Instance(PlotObject)

class TestApplication(unittest.TestCase):

    def test_empty(self):
        a = Application()
        doc = a.create_document()
        assert not doc.roots

    def test_one_handler(self):
        a = Application()
        def add_roots(doc):
            doc.add_root(AnotherModel())
            doc.add_root(SomeModel())
        handler = FunctionHandler(add_roots)
        a.add(handler)
        doc = a.create_document()
        assert len(doc.roots) == 2

    def test_two_handlers(self):
        a = Application()
        def add_roots(doc):
            doc.add_root(AnotherModel())
            doc.add_root(SomeModel())
        def add_one_root(doc):
            doc.add_root(AnotherModel())
        handler = FunctionHandler(add_roots)
        a.add(handler)
        handler2 = FunctionHandler(add_one_root)
        a.add(handler2)
        doc = a.create_document()
        assert len(doc.roots) == 3
