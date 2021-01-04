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

# Bokeh imports
from bokeh._testing.util.filesystem import with_file_contents
from bokeh.document import Document

# Module under test
import bokeh.application.handlers.server_lifecycle as bahs # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

script_adds_four_handlers = """
def on_server_loaded(server_context):
    return "on_server_loaded"
def on_server_unloaded(server_context):
    return "on_server_unloaded"
def on_session_created(session_context):
    return "on_session_created"
def on_session_destroyed(session_context):
    return "on_session_destroyed"
"""

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class Test_ServerLifecycleHandler:
    # Public methods ----------------------------------------------------------

    async def test_empty_lifecycle(self) -> None:
        doc = Document()
        out = {}
        def load(filename):
            handler = bahs.ServerLifecycleHandler(filename=filename)
            handler.modify_document(doc)
            out['handler'] = handler
        with_file_contents("# This script does nothing", load)
        handler = out['handler']
        handler.on_server_loaded(None)
        handler.on_server_unloaded(None)
        await handler.on_session_created(None)
        await handler.on_session_destroyed(None)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert not doc.roots

    def test_lifecycle_bad_syntax(self) -> None:
        result = {}
        def load(filename):
            handler = bahs.ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("This is a syntax error", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'Invalid syntax' in handler.error

    def test_lifecycle_runtime_error(self) -> None:
        result = {}
        def load(filename):
            handler = bahs.ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("raise RuntimeError('nope')", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'nope' in handler.error

    def test_lifecycle_bad_server_loaded_signature(self) -> None:
        result = {}
        def load(filename):
            handler = bahs.ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("""
def on_server_loaded(a,b):
    pass
""", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'on_server_loaded must have signature func(server_context)' in handler.error
        assert 'func(a, b)' in handler.error
        assert "Traceback" in handler.error_detail

    def test_lifecycle_bad_server_unloaded_signature(self) -> None:
        result = {}
        def load(filename):
            handler = bahs.ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("""
def on_server_unloaded(a,b):
    pass
""", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'on_server_unloaded must have signature func(server_context)' in handler.error
        assert 'func(a, b)' in handler.error
        assert "Traceback" in handler.error_detail

    def test_lifecycle_bad_session_created_signature(self) -> None:
        result = {}
        def load(filename):
            handler = bahs.ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("""
def on_session_created(a,b):
    pass
""", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'on_session_created must have signature func(session_context)' in handler.error
        assert 'func(a, b)' in handler.error

    def test_lifecycle_bad_session_destroyed_signature(self) -> None:
        result = {}
        def load(filename):
            handler = bahs.ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("""
def on_session_destroyed(a,b):
    pass
""", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'on_session_destroyed must have signature func(session_context)' in handler.error
        assert 'func(a, b)' in handler.error

    async def test_calling_lifecycle_hooks(self) -> None:
        result = {}
        def load(filename):
            handler = result['handler'] = bahs.ServerLifecycleHandler(filename=filename)
            if handler.failed:
                raise RuntimeError(handler.error)
        with_file_contents(script_adds_four_handlers, load)

        handler = result['handler']
        assert "on_server_loaded" == handler.on_server_loaded(None)
        assert "on_server_unloaded" == handler.on_server_unloaded(None)
        assert "on_session_created" == await handler.on_session_created(None)
        assert "on_session_destroyed" == await handler.on_session_destroyed(None)

    def test_missing_filename_raises(self) -> None:
        with pytest.raises(ValueError):
            bahs.ServerLifecycleHandler()

    def test_url_path(self) -> None:
        result = {}
        def load(filename):
            handler = bahs.ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("""
def on_server_unloaded(server_context):
    pass
""", load)

        handler = result['handler']
        assert handler.error is None
        assert handler.url_path().startswith("/")

    def test_url_path_failed(self) -> None:
        result = {}
        def load(filename):
            handler = bahs.ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("""
# bad signature
def on_server_unloaded():
    pass
""", load)

        handler = result['handler']
        assert handler.error is not None
        assert handler.url_path() is None

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
