''' Assemble websocket wire message fragments into complete Bokeh Server
message objects that can be processed.

'''
from __future__ import absolute_import

from six import b
from tornado.concurrent import return_future

from ..exceptions import MessageError, ProtocolError, ValidationError

HMAC           = 0
HEADER         = 1
METADATA       = 2
CONTENT        = 3
BUFFER_HEADER  = 4
BUFFER_PAYLOAD = 5

class Receiver(object):
    '''

    On MessageError or ValidationError, the receiver will reset its state
    and attempt to consume a new message.

    [
        # these are required
        b'foobarbaz',       # HMAC signature
        b'{header}',        # serialized header dict
        b'{metadata}',      # serialized metadata dict
        b'{content},        # serialized content dict

        # these are optional, and come in pairs
        b'{buf_header}',    # serialized buffer header dict
        b'array'            # raw buffer payload data
        ...
    ]

    '''

    def __init__(self, protocol):
        self._protocol = protocol
        self._expecting = HMAC
        self._message = None
        self._buf_header = None
        self._failures = 0

    @return_future
    def consume(self, fragment, callback=None):
        '''

        '''

        if self._expecting == HMAC:
            if len(fragment) != 64:
                self._failures += 1
                raise ProtocolError("Invalid HMAC signature length")

            self._message = None
            self._partial = None
            self._fragments = [fragment]
            self._expecting = HEADER

        elif self._expecting == HEADER:
            self._fragments.append(fragment)
            self._expecting = METADATA

        elif self._expecting == METADATA:
            self._fragments.append(fragment)
            self._expecting = CONTENT

        elif self._expecting == CONTENT:
            self._fragments.append(fragment)

            hmac, header_json, metadata_json, content_json = self._fragments

            self._partial = self._protocol.assemble(header_json, metadata_json, content_json)

            if b(hmac) != self._partial.hmac:
                self._expecting = HMAC
                self._failures += 1
                raise ValidationError("HMAC signatures do not match")

            if self._partial.complete:
                self._message = self._partial
                self._expecting = HMAC
            else:
                self._expecting = BUFFER_HEADER

        elif self._expecting == BUFFER_HEADER:
            self._buf_header = fragment
            self._expecting = BUFFER_PAYLOAD

        elif self._expecting == BUFFER_PAYLOAD:
            try:
                self._partial.add_buffer(self._buf_header, fragment)
            except MessageError:
                self._expecting = HMAC
                self._failures += 1
                raise

            if self._partial.complete:
                self._message = self._partial
                self._expecting = HMAC
            else:
                self._expecting = BUFFER_HEADER

        callback(self._message)

    @property
    def expecting(self):
        return self._expecting

    @property
    def failures(self):
        return self._failures



