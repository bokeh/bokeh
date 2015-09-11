''' Provide a base class for all Bokeh Server Protocol message types.

'''
from __future__ import absolute_import, print_function

import hashlib
from hmac import HMAC
from tornado.concurrent import return_future
from tornado.escape import json_decode, json_encode

import bokeh.util.serialization as bkserial

from ..exceptions import MessageError


class Message(object):
    ''' The Message base class encapsulates creating, assembling, and
    validating the integrity of Bokeh Server messages. Additionally, it
    provide hooks

    '''

    # TODO (bev) key from settings
    digester = HMAC(key=b"foobarbazquux", digestmod=hashlib.sha256)

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
        self._hmac = None

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
        raise NotImplementedError("")

    @return_future
    def handle_server(self, server, callback=None):
        '''

        '''
        return callback(self._handle_server(server))

    def _handle_server(self, server):
        raise NotImplementedError("")

    @return_future
    def handle_client(self, client, callback=None):
        '''

        '''
        return callback(self._handle_client(client))

    def _handle_client(self, client):
        raise NotImplementedError("")

    def write_buffers(self, conn):
        ''' Write any buffer headers and payloads to the given connection.

        Args:
            conn : any object with a ``write_message`` method.
                Typically, a Tornado WSHandler or WebSocketClientConnection

        Returns:
            int : number of bytes sent

        '''
        raise NotImplementedError("")

    def is_complete(self):
        ''' Returns whether all required parts of a message are present.

        Returns:
            bool : True if the message is complete, False otherwise

        '''
        raise NotImplementedError("")

    @classmethod
    def create_header(cls, session_id):
        ''' Return a message header fragment dict for a given session ID.

        Args:
            session_id : a unique ID for a Bokeh server session.

        Returns:
            dict : a message header

        '''
        return {
            'msgid'   : bkserial.make_id(),
            'sessid'  : session_id,
            'msgtype' : cls.msgtype,
        }

    def send(self, conn):
        ''' Send the message on the given connection.

        Args:
            conn (WebSocketHandler) : a WebSocketHandler to send messages

        Returns:
            int : number of bytes sent

        '''
        sent = 0

        conn.write_message(self.hmac)
        sent += len(self.hmac)

        conn.write_message(self.header_json)
        sent += len(self.header_json)

        conn.write_message(self.metadata_json)
        sent += len(self.metadata_json)

        conn.write_message(self.content_json)
        sent += len(self.content_json)

        sent += self.write_buffers(conn)

        return sent

    @property
    def complete(self):
        return self.is_complete()

    # HMAC fragment properties

    def _as_binary(self, s):
        """
        Make a unicode string binary, for hashing / signing / etc. purposes.
        """
        return s.encode('utf-8')

    @property
    def hmac(self):
        if not self._hmac:
            d = self.digester.copy()
            d.update(self._as_binary(self.header_json))
            d.update(self._as_binary(self.metadata_json))
            d.update(self._as_binary(self.content_json))
            self._hmac = d.hexdigest()
        return self._hmac

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
