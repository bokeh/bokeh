''' Implement and provide message protocols for communication between Bokeh
Servers and clients.

'''
from __future__ import absolute_import

from six import b
from tornado.escape import json_decode

from ..exceptions import ProtocolError
from . import messages
from . import versions

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

    def create(self, msgtype, session_id, *args, **metadata):
        ''' Create a new Message instance for the given type and session id.

        Args:
            msgtype (str) :
            session_id (str) :

        '''
        if msgtype not in self._messages:
            raise ProtocolError("Unknown message type %r for protocol version %s" % (msgtype, self._version))
        return self._messages[msgtype].create(session_id, *args, **metadata)

    def assemble(self, header_json, metadata_json, content_json):
        ''' Create a Message instance assembled from json fragments.

        Args:
            header_json (JSON) :
            metadata_json (JSON) :
            content_json (JSON) :

        Returns:
            message

        '''
        header = json_decode(header_json)
        return self._messages[header['msgtype']].assemble(
            b(header_json), b(metadata_json), b(content_json)
        )

    @property
    def version(self):
        return self._version
