#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from tornado.escape import json_decode

# Bokeh imports
from . import messages
from .exceptions import ProtocolError
from .messages.ack import ack
from .messages.error import error
from .messages.ok import ok
from .messages.patch_doc import patch_doc
from .messages.pull_doc_reply import pull_doc_reply
from .messages.pull_doc_req import pull_doc_req
from .messages.push_doc import push_doc
from .messages.server_info_reply import server_info_reply
from .messages.server_info_req import server_info_req

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Protocol',
)

SPEC = {
    "ACK": ack,
    "ERROR": error,
    "OK": ok,
    'PATCH-DOC': patch_doc,
    'PULL-DOC-REPLY': pull_doc_reply,
    'PULL-DOC-REQ': pull_doc_req,
    'PUSH-DOC': push_doc,
    'SERVER-INFO-REPLY': server_info_reply,
    'SERVER-INFO-REQ': server_info_req,
}

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Protocol(object):
    ''' Provide a message factory for the Bokeh Server message protocol.

    '''
    def __init__(self):
        self._messages = SPEC

    def __repr__(self):
        return "Protocol()"

    def create(self, msgtype, *args, **kwargs):
        ''' Create a new Message instance for the given type.

        Args:
            msgtype (str) :

        '''
        if msgtype not in self._messages:
            raise ProtocolError("Unknown message type %r for Bokeh protocol" % msgtype)
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

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
