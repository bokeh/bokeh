#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provides the ``ServerSession`` class.

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
import codecs

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ServerConnection',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class ServerConnection(object):
    ''' Wraps a websocket connection to a client.
    '''

    def __init__(self, protocol, socket, application_context, session):
        self._protocol = protocol
        self._socket = socket
        self._application_context = application_context
        self._session = session
        self._session.subscribe(self)
        self._ping_count = 0

    @property
    def session(self):
        return self._session

    @property
    def application_context(self):
        return self._application_context

    def detach_session(self):
        """Allow the session to be discarded and don't get change notifications from it anymore"""
        if self._session is not None:
            self._session.unsubscribe(self)
            self._session = None

    def ok(self, message):
        return self.protocol.create('OK', message.header['msgid'])

    def error(self, message, text):
        return self.protocol.create('ERROR', message.header['msgid'], text)

    def send_patch_document(self, event):
        """ Sends a PATCH-DOC message, returning a Future that's completed when it's written out. """
        msg = self.protocol.create('PATCH-DOC', [event])
        # yes, *return* the awaitable, it will be awaited when pending writes are processed
        return self._socket.send_message(msg)

    def send_ping(self):
        self._socket.ping(codecs.encode(str(self._ping_count), "utf-8"))
        self._ping_count += 1

    @property
    def protocol(self):
        return self._protocol

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
