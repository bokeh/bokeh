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

from bokeh.util.api import DEV, GENERAL ; DEV, GENERAL
from bokeh.util.testing import verify_api ; verify_api

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from tornado import locks

# Bokeh imports

# Module under test
import bokeh.client.websocket as bcw

#-----------------------------------------------------------------------------
# API Definition
#-----------------------------------------------------------------------------

api = {

    GENERAL: (

    ), DEV: (

        ( 'WebSocketClientConnectionWrapper',               (1, 0, 0) ),
        ( 'WebSocketClientConnectionWrapper.write_message', (1, 0, 0) ),
        ( 'WebSocketClientConnectionWrapper.close',         (1, 0, 0) ),
        ( 'WebSocketClientConnectionWrapper.read_message',  (1, 0, 0) ),

    )

}

Test_api = verify_api(bcw, api)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Test_WebSocketClientConnectionWrapper(object):

    def test_creation_raises_with_None(self):
        with pytest.raises(ValueError):
            bcw.WebSocketClientConnectionWrapper(None)

    def test_creation(self):
        w = bcw.WebSocketClientConnectionWrapper("socket")
        assert w._socket == "socket"
        assert isinstance(w.write_lock, locks.Lock)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------
