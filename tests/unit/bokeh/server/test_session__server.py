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

# External imports
import mock

# Bokeh imports
from bokeh.document import Document

# Module under test
import bokeh.server.session as bss # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_creation() -> None:
    d = Document()
    s = bss.ServerSession('some-id', d, 'ioloop')
    assert s.id == 'some-id'
    assert s.document == d
    assert s.destroyed is False
    assert s.expiration_requested is False
    assert s.expiration_blocked == 0

def test_subscribe() -> None:
    d = Document()
    s = bss.ServerSession('some-id', d, 'ioloop')
    assert s.connection_count == 0
    s.subscribe('connection1')
    assert s.connection_count == 1
    s.subscribe('connection2')
    assert s.connection_count == 2
    s.unsubscribe('connection1')
    assert s.connection_count == 1
    s.unsubscribe('connection2')
    assert s.connection_count == 0

def test_destroy_calls() -> None:
    d = Document()
    s = bss.ServerSession('some-id', d, 'ioloop')
    with mock.patch('bokeh.document.Document.delete_modules') as docdm:
        with mock.patch('bokeh.document.Document.remove_on_change') as docroc:
            s.destroy()
            assert s.destroyed
            docroc.assert_called_with(s)
        docdm.assert_called_once()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
