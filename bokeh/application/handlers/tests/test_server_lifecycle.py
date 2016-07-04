from __future__ import absolute_import, print_function

import unittest

from bokeh.application.handlers import ServerLifecycleHandler
from bokeh.document import Document
from bokeh.util.testing import with_file_contents

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

class TestServerLifecycle(unittest.TestCase):

    def test_empty_lifecycle(self):
        doc = Document()
        def load(filename):
            handler = ServerLifecycleHandler(filename=filename)
            handler.modify_document(doc)
            handler.on_server_loaded(None)
            handler.on_server_unloaded(None)
            handler.on_session_created(None)
            handler.on_session_destroyed(None)
            if handler.failed:
                raise RuntimeError(handler.error)
        with_file_contents("# This script does nothing", load)

        assert not doc.roots

    def test_lifecycle_bad_syntax(self):
        result = {}
        def load(filename):
            handler = ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("This is a syntax error", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'Invalid syntax' in handler.error

    def test_lifecycle_runtime_error(self):
        result = {}
        def load(filename):
            handler = ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("raise RuntimeError('nope')", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'nope' in handler.error

    def test_lifecycle_bad_server_loaded_signature(self):
        result = {}
        def load(filename):
            handler = ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("""
def on_server_loaded(a,b):
    pass
""", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'on_server_loaded must have signature func(server_context)' in handler.error
        assert 'func(a, b)' in handler.error

    def test_lifecycle_bad_server_unloaded_signature(self):
        result = {}
        def load(filename):
            handler = ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("""
def on_server_unloaded(a,b):
    pass
""", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'on_server_unloaded must have signature func(server_context)' in handler.error
        assert 'func(a, b)' in handler.error

    def test_lifecycle_bad_session_created_signature(self):
        result = {}
        def load(filename):
            handler = ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("""
def on_session_created(a,b):
    pass
""", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'on_session_created must have signature func(session_context)' in handler.error
        assert 'func(a, b)' in handler.error

    def test_lifecycle_bad_session_destroyed_signature(self):
        result = {}
        def load(filename):
            handler = ServerLifecycleHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("""
def on_session_destroyed(a,b):
    pass
""", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'on_session_destroyed must have signature func(session_context)' in handler.error
        assert 'func(a, b)' in handler.error

    def test_calling_lifecycle_hooks(self):
        result = {}
        def load(filename):
            handler = result['handler'] = ServerLifecycleHandler(filename=filename)
            if handler.failed:
                raise RuntimeError(handler.error)
        with_file_contents(script_adds_four_handlers, load)

        handler = result['handler']
        assert "on_server_loaded" == handler.on_server_loaded(None)
        assert "on_server_unloaded" == handler.on_server_unloaded(None)
        assert "on_session_created" == handler.on_session_created(None)
        assert "on_session_destroyed" == handler.on_session_destroyed(None)
