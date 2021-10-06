#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from abc import ABCMeta, abstractmethod
from enum import Enum, auto
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ..core.types import ID

if TYPE_CHECKING:
    from ..protocol.message import Message
    from .connection import ClientConnection

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

class State(metaclass=ABCMeta):

    @abstractmethod
    async def run(self, connection: ClientConnection) -> None:
        pass

class NOT_YET_CONNECTED(State):
    ''' The ``ClientConnection`` is not yet connected.

    '''

    async def run(self, connection: ClientConnection) -> None:
        await connection._connect_async()

class CONNECTED_BEFORE_ACK(State):
    ''' The ``ClientConnection`` connected to a Bokeh server, but has not yet
    received an ACK from it.

    '''

    async def run(self, connection: ClientConnection) -> None:
        await connection._wait_for_ack()

class CONNECTED_AFTER_ACK(State):
    ''' The ``ClientConnection`` connected to a Bokeh server, and has
    received an ACK from it.

    '''

    async def run(self, connection: ClientConnection) -> None:
        await connection._handle_messages()

class DISCONNECTED(State):
    ''' The ``ClientConnection`` was connected to a Bokeh server, but is
    now disconnected.

    '''

    def __init__(self, reason: ErrorReason = ErrorReason.NO_ERROR, error_code: int | None = None, error_detail: str = "") -> None:
        ''' Constructs a DISCONNECT-State with given reason (``ErrorReason``
        enum), error id and additional information provided as string.

        '''
        self._error_code = error_code
        self._error_detail = error_detail
        self._error_reason = reason


    @property
    def error_reason(self) -> ErrorReason:
        ''' The reason for the error encoded as an enumeration value.

        '''
        return self._error_reason

    @property
    def error_code(self) -> int | None:
        ''' Holds the error code, if any. None otherwise.

        '''
        return self._error_code

    @property
    def error_detail(self) -> str:
        ''' Holds the error message, if any. Empty string otherwise.

        '''
        return self._error_detail

    async def run(self, connection: ClientConnection) -> None:
        return

class WAITING_FOR_REPLY(State):
    ''' The ``ClientConnection`` has sent a message to the Bokeh Server which
    should generate a paired reply, and is waiting for the reply.

    '''

    _reply: Message[Any] | None

    def __init__(self, reqid: ID) -> None:
        self._reqid = reqid
        self._reply = None

    @property
    def reply(self) -> Message[Any] | None:
        ''' The reply from the server. (``None`` until the reply arrives) '''
        return self._reply

    @property
    def reqid(self) -> ID:
        ''' The request ID of the originating message. '''
        return self._reqid

    async def run(self, connection: ClientConnection) -> None:
        message = await connection._pop_message()
        if message is None:
            await connection._transition_to_disconnected(DISCONNECTED(ErrorReason.NETWORK_ERROR))
        elif 'reqid' in message.header and message.header['reqid'] == self.reqid:
            self._reply = message
            await connection._transition(CONNECTED_AFTER_ACK())
        else:
            await connection._next()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
