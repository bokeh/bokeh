#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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

# Module under test
import bokeh.protocol.message as message

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_create_header(monkeypatch):
    message.Message.msgtype = "msgtype"
    monkeypatch.setattr("bokeh.util.serialization.make_id", lambda: "msgid")
    header = message.Message.create_header(request_id="bar")
    assert set(header.keys()) == {'msgid', 'msgtype', 'reqid'}
    assert header['msgtype'] == 'msgtype'
    assert header['msgid'] == 'msgid'
    assert header['reqid'] == 'bar'

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
