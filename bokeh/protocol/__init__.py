#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Implement and provide message protocols for communication between Bokeh
Servers and clients.

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
from tornado.escape import json_decode

# Bokeh imports
from . import messages
from . import versions
from .exceptions import ProtocolError

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Protocol',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Protocol(object):
    ''' Provide a message factory for a given version of the Bokeh Server
    message protocol.

    Args:
        version (str) : a string identifying a protocol version, e.g. "1.0"

    '''
    def __init__(self, version):
        if version not in versions.spec:
            raise ProtocolError("Unknown protocol version %r" % version)

        self._version = version
        self._messages = dict()

        for msgtype, revision in versions.spec[version]:
            self._messages[msgtype] = messages.index[(msgtype, revision)]

    def __repr__(self):
        return "Protocol(%r)" % self.version

    def create(self, msgtype, *args, **kwargs):
        ''' Create a new Message instance for the given type.

        Args:
            msgtype (str) :

        '''
        if msgtype not in self._messages:
            raise ProtocolError("Unknown message type %r for protocol version %s" % (msgtype, self._version))
        return self._messages[msgtype].create(*args, **kwargs)

    def assemble(self, header_json, metadata_json, content_json):
        ''' Create a Message instance assembled from json fragments.

        Args:
            header_json (``JSON``) :

            metadata_json (``JSON``) :

            content_json (``JSON``) :

        Returns:
            message

        '''
        header = json_decode(header_json)
        if 'msgtype' not in header:
            log.error("Bad header with no msgtype was: %r", header)
            raise ProtocolError("No 'msgtype' in header")
        return self._messages[header['msgtype']].assemble(
            header_json, metadata_json, content_json
        )

    @property
    def version(self):
        return self._version

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
