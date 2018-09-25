#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a set of objects to represent different stages of a connection
to a Bokeh server.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from tornado import gen

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CONNECTED_BEFORE_ACK',
    'CONNECTED_AFTER_ACK',
    'DISCONNECTED',
    'NOT_YET_CONNECTED',
    'WAITING_FOR_REPLY',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class NOT_YET_CONNECTED(object):
    ''' The ``ClientConnection`` is not yet connected.

    '''

    @gen.coroutine
    def run(self, connection):
        yield connection._connect_async()

class CONNECTED_BEFORE_ACK(object):
    ''' The ``ClientConnection`` connected to a Bokeh server, but has not yet
    received an ACK from it.

    '''

    @gen.coroutine
    def run(self, connection):
        yield connection._wait_for_ack()

class CONNECTED_AFTER_ACK(object):
    ''' The ``ClientConnection`` connected to a Bokeh server, and has
    received an ACK from it.

    '''

    @gen.coroutine
    def run(self, connection):
        yield connection._handle_messages()

class DISCONNECTED(object):
    ''' The ``ClientConnection`` was connected to a Bokeh server, but is
    now disconnected.

    '''

    @gen.coroutine
    def run(self, connection):
        raise gen.Return(None)

class WAITING_FOR_REPLY(object):
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

    @gen.coroutine
    def run(self, connection):
        message = yield connection._pop_message()
        if message is None:
            yield connection._transition_to_disconnected()
        elif 'reqid' in message.header and message.header['reqid'] == self.reqid:
            self._reply = message
            yield connection._transition(CONNECTED_AFTER_ACK())
        else:
            yield connection._next()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
