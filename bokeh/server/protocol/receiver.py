''' Assemble websocket wire message fragments into complete Bokeh Server
message objects that can be processed.

'''
from __future__ import absolute_import

from tornado.concurrent import return_future

from ..exceptions import MessageError, ProtocolError, ValidationError

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
        self._current_consumer = self._HMAC
        self._message = None
        self._buf_header = None
        self._failures = 0

    @property
    def failures(self):
        return self._failures

    @return_future
    def consume(self, fragment, callback=None):
        '''

        '''
        self._current_consumer(fragment)
        callback(self._message)

    def _HMAC(self, fragment):
        if len(fragment) != 64:
            self._failures += 1
            raise ProtocolError("Invalid HMAC signature length")

        self._message = None
        self._partial = None
        self._fragments = [fragment]

        self._current_consumer = self._HEADER

    def _HEADER(self, fragment):
        self._fragments.append(fragment)
        self._current_consumer = self._METADATA

    def _METADATA(self, fragment):
        self._fragments.append(fragment)
        self._current_consumer = self._CONTENT

    def _CONTENT(self, fragment):
        self._fragments.append(fragment)

        hmac, header_json, metadata_json, content_json = self._fragments

        self._partial = self._protocol.assemble(header_json, metadata_json, content_json)

        from six import b
        if b(hmac) != self._partial.hmac:
            self._fail()
            raise ValidationError("HMAC signatures do not match")

        self._check_complete()

    def _BUFFER_HEADER(self, fragment):
        self._buf_header = fragment
        self._current_consumer = self._BUFFER_PAYLOAD

    def _BUFFER_PAYLOAD(self, fragment):
        try:
            self._partial.add_buffer(self._buf_header, fragment)
        except MessageError as e:
            self._fail()
            raise e

        self._check_complete()

    def _check_complete(self):
        if self._partial.complete:
            self._message = self._partial
            self._current_consumer = self._HMAC
        else:
            self._current_consumer = self._BUFFER_HEADER

    def _fail(self):
        self._current_consumer = self._HMAC
        self._failures += 1

