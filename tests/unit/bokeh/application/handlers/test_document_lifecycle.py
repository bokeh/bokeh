#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import logging

# Bokeh imports
from bokeh.document import Document

# Module under test
import bokeh.application.handlers.document_lifecycle as bahd # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class MockSessionContext:
    def __init__(self, doc: Document) -> None:
        self._document = doc
        self.status = None
        self.counter = 0

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------


class Test_DocumentLifecycleHandler:
    # Public methods ----------------------------------------------------------

    def test_document_bad_on_session_destroyed_signature(self) -> None:
        doc = Document()

        def destroy(a, b):
            pass

        with pytest.raises(ValueError):
            doc.on_session_destroyed(destroy)

    async def test_document_on_session_destroyed(self) -> None:
        doc = Document()
        handler = bahd.DocumentLifecycleHandler()

        def destroy(session_context):
            assert doc is session_context._document
            session_context.status = 'Destroyed'

        doc.on_session_destroyed(destroy)

        session_context = MockSessionContext(doc)
        await handler.on_session_destroyed(session_context)
        assert session_context.status == 'Destroyed'
        assert session_context._document.session_destroyed_callbacks == set()

    async def test_document_on_session_destroyed_calls_multiple(self) -> None:
        doc = Document()

        def increment(session_context):
            session_context.counter += 1

        doc.on_session_destroyed(increment)

        def increment_by_two(session_context):
            session_context.counter += 2

        doc.on_session_destroyed(increment_by_two)

        handler = bahd.DocumentLifecycleHandler()
        session_context = MockSessionContext(doc)
        await handler.on_session_destroyed(session_context)
        assert session_context.counter == 3, 'DocumentLifecycleHandler did not call all callbacks'

    async def test_document_on_session_destroyed_exceptions(self, caplog: pytest.LogCaptureFixture) -> None:
        doc = Document()

        def blowup(session_context):
            raise ValueError("boom!")

        doc.on_session_destroyed(blowup)

        handler = bahd.DocumentLifecycleHandler()
        session_context = MockSessionContext(doc)
        with caplog.at_level(logging.WARN):
            await handler.on_session_destroyed(session_context)
            assert len(caplog.records) == 1
            assert "boom!" in caplog.text
