from __future__ import absolute_import, print_function

import pytest

from bokeh.application.handlers import FunctionHandler
from bokeh.application import Application
from bokeh.model import Model
from bokeh.core.properties import Int, Instance

class AnotherModelInTestApplication(Model):
    bar = Int(1)

class SomeModelInTestApplication(Model):
    foo = Int(2)
    child = Instance(Model)


def test_empty():
    a = Application()
    doc = a.create_document()
    assert not doc.roots

def test_one_handler():
    a = Application()
    def add_roots(doc):
        doc.add_root(AnotherModelInTestApplication())
        doc.add_root(SomeModelInTestApplication())
    handler = FunctionHandler(add_roots)
    a.add(handler)
    doc = a.create_document()
    assert len(doc.roots) == 2

def test_two_handlers():
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

def test_no_static_path():
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
    assert a.static_path == None

def test_static_path():
    a = Application()
    def add_roots(doc):
        doc.add_root(AnotherModelInTestApplication())
        doc.add_root(SomeModelInTestApplication())
    def add_one_root(doc):
        doc.add_root(AnotherModelInTestApplication())
    handler = FunctionHandler(add_roots)
    handler._static = "foo"
    a.add(handler)
    handler2 = FunctionHandler(add_one_root)
    a.add(handler2)
    assert a.static_path == "foo"

def test_excess_static_path():
    a = Application()
    def add_roots(doc):
        doc.add_root(AnotherModelInTestApplication())
        doc.add_root(SomeModelInTestApplication())
    def add_one_root(doc):
        doc.add_root(AnotherModelInTestApplication())
    handler = FunctionHandler(add_roots)
    handler._static = "foo"
    a.add(handler)
    handler2 = FunctionHandler(add_one_root)
    handler2._static = "bar"
    with pytest.raises(RuntimeError) as e:
        a.add(handler2)
    assert "More than one static path" in str(e)
