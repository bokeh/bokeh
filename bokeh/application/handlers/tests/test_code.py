import pytest

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

script_uses_iofuncs = """
from bokeh.io import curdoc
from bokeh.model import Model
from bokeh.core.properties import Int
import bokeh.io as io

io.output_server()
io.output_notebook()
io.output_file("foo")

class IOFuncModelInTestScript(Model):
    bar = Int(1)

curdoc().add_root(IOFuncModelInTestScript())

io.save()
io.show()
io.push()
io.reset_output()

"""

script_uses_client = """
from bokeh.io import curdoc
from bokeh.model import Model
from bokeh.core.properties import Int
import bokeh.client as client

session = client.push_session()

class ClientModelInTestScript(Model):
    bar = Int(1)

curdoc().add_root(ClientModelInTestScript())

session.show()
session.loop_until_closed()

"""


def test_empty_script():
    doc = Document()
    handler = CodeHandler(source="# This script does nothing", filename="/test_filename")
    handler.modify_document(doc)
    if handler.failed:
        raise RuntimeError(handler.error)

    assert not doc.roots

def test_script_adds_roots():
    doc = Document()
    handler = CodeHandler(source=script_adds_two_roots, filename="/test_filename")
    handler.modify_document(doc)
    if handler.failed:
        raise RuntimeError(handler.error)

    assert len(doc.roots) == 2

def test_script_bad_syntax():
    doc = Document()
    handler = CodeHandler(source="This is a syntax error", filename="/test_filename")
    handler.modify_document(doc)

    assert handler.error is not None
    assert 'Invalid syntax' in handler.error

def test_script_runtime_error():
    doc = Document()
    handler = CodeHandler(source="raise RuntimeError('nope')", filename="/test_filename")
    handler.modify_document(doc)

    assert handler.error is not None
    assert 'nope' in handler.error

def test_script_sys_path():
    doc = Document()
    handler = CodeHandler(source="""import sys; raise RuntimeError("path: '%s'" % sys.path[0])""", filename="/test_filename")
    handler.modify_document(doc)

    assert handler.error is not None
    assert "path: ''" in handler.error

def test_script_cwd():
    doc = Document()
    handler = CodeHandler(source="""import os; raise RuntimeError("cwd: '%s'" % os.getcwd())""", filename="/test_filename")
    handler.modify_document(doc)

    assert handler.error is not None
    assert "cwd: '/'" in handler.error

def test_script_argv():
    doc = Document()
    handler = CodeHandler(source="""import sys; raise RuntimeError("argv: %r" % sys.argv)""", filename="/test_filename")
    handler.modify_document(doc)

    assert handler.error is not None
    assert "argv: ['test_filename']" in handler.error

    doc = Document()
    handler = CodeHandler(source="""import sys; raise RuntimeError("argv: %r" % sys.argv)""", filename="/test_filename", argv=[10, 20, 30])
    handler.modify_document(doc)

    assert handler.error is not None
    assert "argv: ['test_filename', 10, 20, 30]" in handler.error

def test_script_uses_iofuncs():
    doc = Document()
    handler = CodeHandler(source=script_uses_iofuncs, filename="/test_filename")
    handler._logger_text = "%s, %s"
    handler.modify_document(doc)
    if handler.failed:
        raise RuntimeError(handler.error)
    assert handler.failed is False
    assert handler.error is None
    assert len(doc.roots) == 1
    import sys; sys.stderr.flush()

def test_script_uses_client():
    doc = Document()
    handler = CodeHandler(source=script_uses_client, filename="/test_filename")
    handler._logger_text = "%s, %s"
    handler.modify_document(doc)
    if handler.failed:
        raise RuntimeError(handler.error)
    assert handler.failed is False
    assert handler.error is None
    assert len(doc.roots) == 1
