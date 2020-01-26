#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
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
from bokeh.document import Document

# Module under test
import bokeh.application.handlers.document_lifecycle as bahd # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class MockSessionContext(object):
    def __init__(self, doc):
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

class Test_DocumentLifecycleHandler(object):

    # Public methods ----------------------------------------------------------

    def test_document_bad_on_session_destroyed_signature(self) -> None:
        doc = Document()

        def destroy(a, b):
            pass

        with pytest.raises(ValueError):
            doc.on_session_destroyed(destroy)

    @pytest.mark.asyncio
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

    @pytest.mark.asyncio
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
