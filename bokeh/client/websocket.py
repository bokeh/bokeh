#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a low-level wrapper for Tornado Websockets that adds locking
and smooths some compatibility issues.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import general, dev ; general, dev

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from tornado import gen, locks
from tornado.websocket import WebSocketError

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@dev((1,0,0))
class WebSocketClientConnectionWrapper(object):
    ''' Used for compat across Tornado versions and to add write_lock'''

    def __init__(self, socket):
        if socket is None:
            raise ValueError("socket must not be None")
        self._socket = socket
        # write_lock allows us to lock the connection to send multiple
        # messages atomically.
        self.write_lock = locks.Lock()

    # Internal methods --------------------------------------------------------

    @gen.coroutine
    @dev((1,0,0))
    def write_message(self, message, binary=False, locked=True):
        ''' Write a message to the websocket after obtaining the appropriate
        Bokeh Document lock.

        '''
        def write_message_unlocked():
            if self._socket.protocol is None:
                # Tornado is maybe supposed to do this, but in fact it
                # tries to do _socket.protocol.write_message when protocol
                # is None and throws AttributeError or something. So avoid
                # trying to write to the closed socket. There doesn't seem
                # to be an obvious public function to check if the socket
                # is closed.
                raise WebSocketError("Connection to the server has been closed")

            future = self._socket.write_message(message, binary)

            # don't yield this future or we're blocking on ourselves!
            raise gen.Return(future)

        if locked:
            with (yield self.write_lock.acquire()):
                write_message_unlocked()
        else:
            write_message_unlocked()

    @dev((1,0,0))
    def close(self, code=None, reason=None):
        ''' Close the websocket. '''
        return self._socket.close(code, reason)

    @dev((1,0,0))
    def read_message(self, callback=None):
        ''' Read a message from websocket and execute a callback.

        '''
        return self._socket.read_message(callback)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
