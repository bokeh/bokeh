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

# Module under test
import bokeh.application.handlers.server_request_handler as basrh # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

script_adds_handler = """
def process_request(request):
    return {'Custom': 'Test'}
"""

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------


class Test_ServerRequestHandler:
    # Public methods ----------------------------------------------------------

    def test_request_bad_syntax(self) -> None:
        result = {}
        def load(filename):
            handler = basrh.ServerRequestHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("This is a syntax error", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'Invalid syntax' in handler.error

    def test_request_runtime_error(self) -> None:
        result = {}
        def load(filename):
            handler = basrh.ServerRequestHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("raise RuntimeError('nope')", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'nope' in handler.error

    def test_lifecycle_bad_process_request_signature(self) -> None:
        result = {}
        def load(filename):
            handler = basrh.ServerRequestHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("""
def process_request(a,b):
    pass
""", load)

        handler = result['handler']
        assert handler.error is not None
        assert 'process_request must have signature func(request)' in handler.error
        assert 'func(a, b)' in handler.error

    def test_url_path(self) -> None:
        result = {}
        def load(filename):
            handler = basrh.ServerRequestHandler(filename=filename)
            result['handler'] = handler
        with_file_contents("def process_request(request): return {}", load)

        handler = result['handler']
        assert handler.error is None
        assert handler.url_path().startswith("/")

    def test_missing_filename_raises(self) -> None:
        with pytest.raises(ValueError):
            basrh.ServerRequestHandler()

    async def test_empty_request_handler(self) -> None:
        out = {}
        def load(filename):
            handler = basrh.ServerRequestHandler(filename=filename)
            out['handler'] = handler
        with_file_contents("# This script does nothing", load)
        handler = out['handler']
        payload = handler.process_request(None)
        if handler.failed:
            raise RuntimeError(handler.error)
        assert payload == {}

    async def test_calling_request_handler(self) -> None:
        result = {}
        def load(filename):
            handler = result['handler'] = basrh.ServerRequestHandler(filename=filename)
            if handler.failed:
                raise RuntimeError(handler.error)
        with_file_contents(script_adds_handler, load)

        handler = result['handler']
        assert {"Custom": "Test"} == handler.process_request(None)
