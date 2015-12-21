''' Provide a base class for all Bokeh Server Protocol message types.

'''
from __future__ import absolute_import, print_function

from tornado.escape import json_decode, json_encode
from tornado import gen

import bokeh.util.serialization as bkserial

from ..exceptions import MessageError, ProtocolError


class Message(object):
    ''' The Message base class encapsulates creating, assembling, and
    validating the integrity of Bokeh Server messages. Additionally, it
    provide hooks

    '''

    def __init__(self, header, metadata, content):
        ''' Initialize a new message from header, metadata, and content
        dictionaries.

        To assemble a message from existing JSON fragments, use the
        ``assemble`` method.

        To create new messages with automatically generated headers,
        use subclass ``create`` methods.

        '''
        self.header = header
        self.metadata = metadata
        self.content = content
        self._buffers = []

    def __repr__(self):
        return "Message %r (revision %d)" % (self.msgtype, self.revision)

    @classmethod
    def assemble(cls, header_json, metadata_json, content_json):
        ''' Creates a new message, assembled from JSON fragments.

        Args:
            header_json (JSON) :
            metadata_json (JSON) :
            content_json (JSON) :

        Returns:
            Message subclass

        Raises:
            MessageError

        '''

        try:
            header = json_decode(header_json)
        except ValueError:
            raise MessageError("header could not be decoded")

        try:
            metadata = json_decode(metadata_json)
        except ValueError:
            raise MessageError("metadata could not be decoded")

        try:
            content = json_decode(content_json)
        except ValueError:
            raise MessageError("content could not be decoded")

        msg = cls(header, metadata, content)

        msg._header_json = header_json
        msg._metadata_json = metadata_json
        msg._content_json = content_json

        return msg

    def add_buffer(self, buf_header, buf_payload):
        ''' Associate a buffer header and payload with this message.

        Args:
            buf_header (JSON) : a buffer header
            buf_payload (JSON or bytes) : a buffer payload

        Returns:
            None

        Raises:
            MessageError

        '''
        if 'num_buffers' in self._header:
            self._header['num_buffers'] += 1
        else:
            self._header['num_buffers'] = 1

        self._header_json = None

        self._buffers.add((buf_header, buf_payload))

    def assemble_buffer(self, buf_header, buf_payload):
        ''' Add a buffer header and payload that we read from the socket.

        This differs from add_buffer() because we're validating vs.
        the header's num_buffers, instead of filling in the header.

        Args:
            buf_header (JSON) : a buffer header
            buf_payload (JSON or bytes) : a buffer payload

        Returns:
            None

        Raises:
            ProtocolError
        '''
        if self.header['num_buffers'] <= len(self._buffers):
            raise ProtocolError("too many buffers received expecting " + str(self.header['num_buffers']))
        self._buffers.append((buf_header, buf_payload))

    @gen.coroutine
    def write_buffers(self, conn, locked=True):
        ''' Write any buffer headers and payloads to the given connection.

        Args:
            conn : any object with a ``write_message`` method.
                Typically, a Tornado WSHandler or WebSocketClientConnection

        Returns:
            int : number of bytes sent

        '''
        if conn is None:
            raise ValueError("Cannot write_buffers to connection None")
        sent = 0
        for header, payload in self._buffers:
            yield conn.write_message(header, locked=locked)
            yield conn.write_message(payload, binary=True, locked=locked)
            sent += (len(header) + len(payload))
        raise gen.Return(sent)

    @classmethod
    def create_header(cls, request_id=None):
        ''' Return a message header fragment dict.

        Args:
            request_id (str or None) : message ID of the message this message replies to

        Returns:
            dict : a message header

        '''
        header = {
            'msgid'   : bkserial.make_id(),
            'msgtype' : cls.msgtype
        }
        if request_id is not None:
            header['reqid'] = request_id
        return header

    @gen.coroutine
    def send(self, conn):
        ''' Send the message on the given connection.

        Args:
            conn (WebSocketHandler) : a WebSocketHandler to send messages

        Returns:
            int : number of bytes sent

        '''
        if conn is None:
            raise ValueError("Cannot send to connection None")

        with (yield conn.write_lock.acquire()):
            sent = 0

            yield conn.write_message(self.header_json, locked=False)
            sent += len(self.header_json)

            # uncomment this to make it a lot easier to reproduce lock-related bugs
            #yield gen.sleep(0.1)

            yield conn.write_message(self.metadata_json, locked=False)
            sent += len(self.metadata_json)

            # uncomment this to make it a lot easier to reproduce lock-related bugs
            #yield gen.sleep(0.1)

            yield conn.write_message(self.content_json, locked=False)
            sent += len(self.content_json)

            sent += yield self.write_buffers(conn, locked=False)

            raise gen.Return(sent)

    @property
    def complete(self):
        ''' Returns whether all required parts of a message are present.

        Returns:
            bool : True if the message is complete, False otherwise

        '''
        return self.header is not None and \
            self.metadata is not None and \
            self.content is not None and \
            self.header.get('num_buffers', 0) == len(self._buffers)

    # header fragment properties

    @property
    def header(self):
        return self._header

    @header.setter
    def header(self, value):
        self._header = value
        self._header_json = None

    @property
    def header_json(self):
        if not self._header_json:
            self._header_json = json_encode(self.header)
        return self._header_json

    # content fragment properties

    @property
    def content(self):
        return self._content

    @content.setter
    def content(self, value):
        self._content = value
        self._content_json = None

    @property
    def content_json(self):
        if not self._content_json:
            self._content_json = json_encode(self.content)
        return self._content_json

    # metadata fragment properties

    @property
    def metadata(self):
        return self._metadata

    @metadata.setter
    def metadata(self, value):
        self._metadata = value
        self._metadata_json = None

    @property
    def metadata_json(self):
        if not self._metadata_json:
            self._metadata_json = json_encode(self.metadata)
        return self._metadata_json

    @property
    def buffers(self):
        return self._buffers

    @buffers.setter
    def buffers(self, value):
        self._buffers = list(value)
