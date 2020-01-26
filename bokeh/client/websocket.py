#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a low-level wrapper for Tornado Websockets that adds locking
and smooths some compatibility issues.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from tornado import locks
from tornado.websocket import WebSocketError

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'WebSocketClientConnectionWrapper',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class WebSocketClientConnectionWrapper(object):
    ''' Used for compatibility across Tornado versions and to add write_lock'''

    def __init__(self, socket):
        if socket is None:
            raise ValueError("socket must not be None")
        self._socket = socket
        # write_lock allows us to lock the connection to send multiple
        # messages atomically.
        self.write_lock = locks.Lock()

    # Internal methods --------------------------------------------------------

    async def write_message(self, message, binary=False, locked=True):
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

            # don't await this future or we're blocking on ourselves!
            return future

        if locked:
            with await self.write_lock.acquire():
                write_message_unlocked()
        else:
            write_message_unlocked()

    def close(self, code=None, reason=None):
        ''' Close the websocket. '''
        return self._socket.close(code, reason)

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
