from __future__ import absolute_import, print_function

import pytest

import jinja2

from bokeh.application.handlers import DirectoryHandler
from bokeh.core.templates import FILE
from bokeh.document import Document
from bokeh.util.testing import with_directory_contents

script_adds_two_roots_template = """
from bokeh.io import curdoc
from bokeh.model import Model
from bokeh.core.properties import Int, Instance

class %s(Model):
    bar = Int(1)

class %s(Model):
    foo = Int(2)
    child = Instance(Model)

curdoc().add_root(%s())
curdoc().add_root(%s())
"""

def script_adds_two_roots(some_model_name, another_model_name):
    return script_adds_two_roots_template % (another_model_name, some_model_name,
                                             another_model_name, some_model_name)

script_has_lifecycle_handlers = """
def on_server_loaded(server_context):
    return "on_server_loaded"
def on_server_unloaded(server_context):
    return "on_server_unloaded"
def on_session_created(session_context):
    return "on_session_created"
def on_session_destroyed(session_context):
    return "on_session_destroyed"
"""

def test_directory_empty_mainpy():
    doc = Document()
    def load(filename):
        handler = DirectoryHandler(filename=filename)
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

    with_directory_contents({
        'main.py' : "# This script does nothing"
    }, load)

    assert not doc.roots

def test_directory_mainpy_adds_roots():
    doc = Document()
    def load(filename):
        handler = DirectoryHandler(filename=filename)
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

    with_directory_contents({
        'main.py' : script_adds_two_roots('SomeModelInTestDirectory',
                                          'AnotherModelInTestDirectory')
    }, load)

    assert len(doc.roots) == 2

def test_directory_has_theme_file():
    doc = Document()
    def load(filename):
        handler = DirectoryHandler(filename=filename)
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

    custom_theme = """
attrs:
    AnotherModelInTestDirectoryTheme:
        bar: 42
    SomeModelInTestDirectoryTheme:
        foo: 14
"""

    with_directory_contents({
        'main.py' : script_adds_two_roots('SomeModelInTestDirectoryTheme',
                                          'AnotherModelInTestDirectoryTheme') +
        """
# we're testing that the script can override the theme
some = next(m for m in curdoc().roots if isinstance(m, SomeModelInTestDirectoryTheme))
some.foo = 57
        """,
        'theme.yaml' : custom_theme
    }, load)

    assert len(doc.roots) == 2
    some_model = next(m for m in doc.roots if m.__class__.__name__ == 'SomeModelInTestDirectoryTheme')
    another_model = next(m for m in doc.roots if m.__class__.__name__ == 'AnotherModelInTestDirectoryTheme')
    assert another_model.bar == 42
    assert some_model.foo == 57
    # test that we use the theme if we delete our explicit-set value
    del some_model.foo
    assert some_model.foo == 14
    # test that removing the theme gets us back to the base
    doc.theme = None
    assert some_model.foo == 2
    assert another_model.bar == 1

def test_directory_with_server_lifecycle():
    doc = Document()
    result = {}
    def load(filename):
        handler = DirectoryHandler(filename=filename)
        result['handler'] = handler
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

    with_directory_contents({
        'main.py' : script_adds_two_roots('SomeModelInTestDirectoryWithLifecycle',
                                          'AnotherModelInTestDirectoryWithLifecycle'),
        'server_lifecycle.py' : script_has_lifecycle_handlers
    }, load)

    assert len(doc.roots) == 2

    handler = result['handler']

    assert "on_server_loaded" == handler.on_server_loaded(None)
    assert "on_server_unloaded" == handler.on_server_unloaded(None)
    assert "on_session_created" == handler.on_session_created(None)
    assert "on_session_destroyed" == handler.on_session_destroyed(None)

def test_directory_with_static():
    doc = Document()
    result = {}
    def load(filename):
        handler = DirectoryHandler(filename=filename)
        result['handler'] = handler
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

    with_directory_contents({
        'main.py' : "# This script does nothing",
        'static/js/foo.js' : "# some JS"
    }, load)

    assert not doc.roots

    handler = result['handler']
    assert handler.static_path() is not None
    assert handler.static_path().endswith("static")

def test_directory_without_static():
    doc = Document()
    result = {}
    def load(filename):
        handler = DirectoryHandler(filename=filename)
        result['handler'] = handler
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

    with_directory_contents({
        'main.py' : "# This script does nothing",
    }, load)

    assert not doc.roots

    handler = result['handler']
    assert handler.static_path() is None

def test_directory_with_template():
    doc = Document()
    result = {}
    def load(filename):
        handler = DirectoryHandler(filename=filename)
        result['handler'] = handler
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

    with_directory_contents({
        'main.py' : "# This script does nothing",
        'templates/index.html' : "<div>some HTML</div>"
    }, load)

    assert not doc.roots

    assert isinstance(doc.template, jinja2.Template)

def test_directory_without_template():
    doc = Document()
    result = {}
    def load(filename):
        handler = DirectoryHandler(filename=filename)
        result['handler'] = handler
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)

    with_directory_contents({
        'main.py' : "# This script does nothing",
    }, load)

    assert not doc.roots

    assert doc.template is FILE

def test_safe_to_fork():
    doc = Document()
    result = {}
    def load(filename):
        handler = DirectoryHandler(filename=filename)
        assert handler.safe_to_fork
        result['handler'] = handler
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert not handler.safe_to_fork

    with_directory_contents({
        'main.py' : "# This script does nothing",
    }, load)

def test_missing_filename_raises():
    with pytest.raises(ValueError):
        DirectoryHandler()

def test_url_path():
    doc = Document()
    result = {}
    def load(filename):
        handler = DirectoryHandler(filename=filename)
        assert handler.safe_to_fork
        result['handler'] = handler
        handler.modify_document(doc)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert not handler.safe_to_fork

    with_directory_contents({
        'main.py' : "# This script does nothing",
    }, load)

    h = result['handler']
    assert h.url_path().startswith("/")
    h._main_handler._runner._failed = True
    assert h.url_path() is None
