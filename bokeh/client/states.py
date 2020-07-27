#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a set of objects to represent different stages of a connection
to a Bokeh server.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from enum import Enum, auto

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CONNECTED_BEFORE_ACK',
    'CONNECTED_AFTER_ACK',
    'DISCONNECTED',
    'ErrorReason',
    'NOT_YET_CONNECTED',
    'WAITING_FOR_REPLY',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class ErrorReason(Enum):
    NO_ERROR        = auto()
    HTTP_ERROR      = auto()
    NETWORK_ERROR   = auto()

class NOT_YET_CONNECTED:
    ''' The ``ClientConnection`` is not yet connected.

    '''

    async def run(self, connection):
        return await connection._connect_async()

class CONNECTED_BEFORE_ACK:
    ''' The ``ClientConnection`` connected to a Bokeh server, but has not yet
    received an ACK from it.

    '''

    async def run(self, connection):
        return await connection._wait_for_ack()

class CONNECTED_AFTER_ACK:
    ''' The ``ClientConnection`` connected to a Bokeh server, and has
    received an ACK from it.

    '''

    async def run(self, connection):
        return await connection._handle_messages()

class DISCONNECTED:
    ''' The ``ClientConnection`` was connected to a Bokeh server, but is
    now disconnected.

    '''

    def __init__(self, reason=ErrorReason.NO_ERROR, error_code=None, error_detail=""):
        ''' Constructs a DISCONNECT-State with given reason (``ErrorReason``
        enum), error id and additional information provided as string.

        '''
        self._error_code = error_code
        self._error_detail = error_detail
        self._error_reason = reason


    @property
    def error_reason(self):
        ''' The reason for the error encoded as an enumeration value.

        '''
        return self._error_reason

    @property
    def error_code(self):
        ''' Holds the error code, if any. None otherwise.

        '''
        return self._error_code

    @property
    def error_detail(self):
        ''' Holds the error message, if any. Empty string otherwise.

        '''
        return self._error_detail

    async def run(self, connection):
        return None

class WAITING_FOR_REPLY:
    ''' The ``ClientConnection`` has sent a message to the Bokeh Server which
    should generate a paired reply, and is waiting for the reply.

    '''
    def __init__(self, reqid):
        self._reqid = reqid
        self._reply = None

    @property
    def reply(self):
        ''' The reply from the server. (``None`` until the reply arrives) '''
        return self._reply

    @property
    def reqid(self):
        ''' The request ID of the originating message. '''
        return self._reqid

    async def run(self, connection):
        message = await connection._pop_message()
        if message is None:
            return await connection._transition_to_disconnected()
        elif 'reqid' in message.header and message.header['reqid'] == self.reqid:
            self._reply = message
            return await connection._transition(CONNECTED_AFTER_ACK())
        else:
            return await connection._next()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
