from __future__ import absolute_import, print_function

import mock
import pytest

from bokeh.application.handlers import FunctionHandler
from bokeh.application import Application
from bokeh.document import Document
from bokeh.model import Model
from bokeh.plotting import figure
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

@mock.patch('bokeh.document.check_integrity')
def test_application_validates_document_by_default(check_integrity):
    a = Application()
    d = Document()
    d.add_root(figure())
    a.initialize_document(d)
    assert check_integrity.called

@mock.patch('bokeh.document.check_integrity')
def test_application_doesnt_validate_document_due_to_env_var(check_integrity, monkeypatch):
    monkeypatch.setenv("BOKEH_VALIDATE_DOC", "false")
    a = Application()
    d = Document()
    d.add_root(figure())
    a.initialize_document(d)
    assert not check_integrity.called
