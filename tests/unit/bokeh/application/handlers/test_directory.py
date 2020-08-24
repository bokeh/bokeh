#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
import jinja2

# Bokeh imports
from bokeh._testing.util.filesystem import with_directory_contents
from bokeh.core.templates import FILE
from bokeh.document import Document

# Module under test
import bokeh.application.handlers.directory as bahd # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

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

script_has_request_handler = """
def process_request(request):
    return request['headers']
"""

script_has_lifecycle_and_request_handlers = script_has_lifecycle_handlers + script_has_request_handler

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def script_adds_two_roots(some_model_name, another_model_name):
    return script_adds_two_roots_template % (another_model_name, some_model_name,
                                             another_model_name, some_model_name)

class Test_DirectoryHandler:
    # Public methods ----------------------------------------------------------

    def test_directory_empty_mainpy(self) -> None:
        doc = Document()
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)

        with_directory_contents({
            'main.py' : "# This script does nothing"
        }, load)

        assert not doc.roots

    def test_directory_initpy(self) -> None:
        doc = Document()
        results = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
            handler.modify_document(doc)
            # this will get called by the server but we have to fake it here
            handler.on_server_loaded("server_context")
            results['package'] = handler._package is not None and handler._package_runner is not None and handler._package_runner.ran
            if handler.failed:
                raise RuntimeError(handler.error)

        with_directory_contents({
            'main.py' : "from . import foo\n" + script_adds_two_roots('SomeModelInTestDirectory',
                                                                      'AnotherModelInTestDirectory'),
            "__init__.py": "",
            "foo.py": " # this script does nothing"

        }, load)

        assert len(doc.roots) == 2
        assert results['package'] == True

    def test_directory_mainpy_adds_roots(self) -> None:
        doc = Document()
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)

        with_directory_contents({
            'main.py' : script_adds_two_roots('SomeModelInTestDirectory',
                                              'AnotherModelInTestDirectory')
        }, load)

        assert len(doc.roots) == 2

    def test_directory_empty_mainipynb(self) -> None:
        import nbformat

        doc = Document()
        source = nbformat.v4.new_notebook()
        result = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
            handler.modify_document(doc)
            result['handler'] = handler
            result['filename'] = filename
            if handler.failed:
                raise RuntimeError(handler.error)

        with_directory_contents({
            'main.ipynb': nbformat.writes(source)
        }, load)

        assert not doc.roots

    def test_directory_mainipynb_adds_roots(self) -> None:
        import nbformat

        doc = Document()
        source = nbformat.v4.new_notebook()
        code = script_adds_two_roots('SomeModelInNbTestDirectory',
                                     'AnotherModelInNbTestDirectory')
        source.cells.append(nbformat.v4.new_code_cell(code))
        result = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
            handler.modify_document(doc)
            result['handler'] = handler
            result['filename'] = filename
            if handler.failed:
                raise RuntimeError(handler.error)

        with_directory_contents({
            'main.ipynb': nbformat.writes(source)
        }, load)

        assert len(doc.roots) == 2

    def test_directory_both_mainipynb_and_mainpy(self) -> None:
        doc = Document()
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)

        import nbformat
        source = nbformat.v4.new_notebook()

        with_directory_contents({
            'main.py' : script_adds_two_roots('SomeModelInTestDirectory',
                                              'AnotherModelInTestDirectory'),
            'main.ipynb': nbformat.writes(source),
        }, load)

        assert len(doc.roots) == 2

    def test_directory_missing_main(self) -> None:
        doc = Document()
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)
        with pytest.raises(ValueError):
            with_directory_contents({}, load)

    def test_directory_has_theme_file(self) -> None:
        doc = Document()
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
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

    async def test_directory_with_server_lifecycle(self) -> None:
        doc = Document()
        result = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
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
        assert "on_session_created" == await handler.on_session_created(None)
        assert "on_session_destroyed" == await handler.on_session_destroyed(None)

    async def test_directory_with_app_hooks(self) -> None:
        doc = Document()
        result = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
            result['handler'] = handler
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)

        with_directory_contents({
            'main.py' : script_adds_two_roots('SomeModelInTestDirectoryWithLifecycle',
                                              'AnotherModelInTestDirectoryWithLifecycle'),
            'app_hooks.py' : script_has_lifecycle_and_request_handlers
        }, load)

        assert len(doc.roots) == 2

        handler = result['handler']

        assert "on_server_loaded" == handler.on_server_loaded(None)
        assert "on_server_unloaded" == handler.on_server_unloaded(None)
        assert "on_session_created" == await handler.on_session_created(None)
        assert "on_session_destroyed" == await handler.on_session_destroyed(None)
        assert dict(foo=10) == handler.process_request(dict(headers=dict(foo=10)))

    async def test_directory_with_lifecycle_and_app_hooks_errors(self) -> None:
        def load(filename):
            with pytest.raises(ValueError):
                bahd.DirectoryHandler(filename=filename)

        with_directory_contents({
            'main.py' : script_adds_two_roots('SomeModelInTestDirectoryWithLifecycle',
                                              'AnotherModelInTestDirectoryWithLifecycle'),
            'app_hooks.py' : script_has_lifecycle_handlers,
            'server_lifecycle.py': script_has_request_handler
        }, load)

    async def test_directory_with_request_handler(self) -> None:
        doc = Document()
        result = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
            result['handler'] = handler
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)

        with_directory_contents({
            'main.py' : script_adds_two_roots('SomeModelInTestDirectoryWithLifecycle',
                                              'AnotherModelInTestDirectoryWithLifecycle'),
            'app_hooks.py' : script_has_request_handler
        }, load)

        assert len(doc.roots) == 2

        handler = result['handler']

        assert dict(foo=10) == handler.process_request(dict(headers=dict(foo=10)))

    def test_directory_with_static(self) -> None:
        doc = Document()
        result = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
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

    def test_directory_without_static(self) -> None:
        doc = Document()
        result = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
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

    def test_directory_with_template(self) -> None:
        doc = Document()
        result = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
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

    def test_directory_without_template(self) -> None:
        doc = Document()
        result = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
            result['handler'] = handler
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)

        with_directory_contents({
            'main.py' : "# This script does nothing",
        }, load)

        assert not doc.roots

        assert doc.template is FILE

    def test_safe_to_fork(self) -> None:
        doc = Document()
        result = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
            assert handler.safe_to_fork
            result['handler'] = handler
            handler.modify_document(doc)
            if handler.failed:
                raise RuntimeError(handler.error)
            assert not handler.safe_to_fork

        with_directory_contents({
            'main.py' : "# This script does nothing",
        }, load)

    def test_missing_filename_raises(self) -> None:
        with pytest.raises(ValueError):
            bahd.DirectoryHandler()

    def test_url_path(self) -> None:
        doc = Document()
        result = {}
        def load(filename):
            handler = bahd.DirectoryHandler(filename=filename)
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

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
