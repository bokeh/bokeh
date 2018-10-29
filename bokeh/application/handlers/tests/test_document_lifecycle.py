#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.document import Document

# Module under test
import bokeh.application.handlers.document_lifecycle as bahd

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

    def test_document_bad_on_session_destroyed_signature(self):
        doc = Document()

        def destroy(a, b):
            pass

        with pytest.raises(ValueError):
            doc.on_session_destroyed(destroy)

    def test_document_on_session_destroyed(self):
        doc = Document()
        handler = bahd.DocumentLifecycleHandler()

        def destroy(session_context):
            assert doc is session_context._document
            session_context.status = 'Destroyed'

        doc.on_session_destroyed(destroy)

        session_context = MockSessionContext(doc)
        handler.on_session_destroyed(session_context)
        assert session_context.status == 'Destroyed'
        assert session_context._document.session_destroyed_callbacks == set()

    def test_document_on_session_destroyed_calls_multiple(self):
        doc = Document()

        def increment(session_context):
            session_context.counter += 1

        doc.on_session_destroyed(increment)

        def increment_by_two(session_context):
            session_context.counter += 2

        doc.on_session_destroyed(increment_by_two)

        handler = bahd.DocumentLifecycleHandler()
        session_context = MockSessionContext(doc)
        handler.on_session_destroyed(session_context)
        assert session_context.counter == 3, 'DocumentLifecycleHandler did not call all callbacks'
