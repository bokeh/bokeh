#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any, Awaitable, Callable

# External imports
from tornado import locks
from tornado.websocket import WebSocketClientConnection

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

class WebSocketClientConnectionWrapper:
    ''' Used for compatibility across Tornado versions and to add write_lock'''

    def __init__(self, socket: WebSocketClientConnection) -> None:
        self._socket = socket
        # write_lock allows us to lock the connection to send multiple
        # messages atomically.
        self.write_lock = locks.Lock()

    # Internal methods --------------------------------------------------------

    async def write_message(self, message: str | bytes, binary: bool = False, locked: bool = True) -> None:
        ''' Write a message to the websocket after obtaining the appropriate
        Bokeh Document lock.

        '''
        if locked:
            with await self.write_lock.acquire():
                self._socket.write_message(message, binary)
        else:
            self._socket.write_message(message, binary)

    def close(self, code: int | None = None, reason: str | None = None) -> None:
        ''' Close the websocket. '''
        return self._socket.close(code, reason)

    def read_message(self, callback: Callable[..., Any] | None = None) -> Awaitable[None | str | bytes]:
        ''' Read a message from websocket and execute a callback.

        '''
        return self._socket.read_message(callback)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
