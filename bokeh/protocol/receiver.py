#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Assemble WebSocket wire message fragments into complete Bokeh Server
message objects that can be processed.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from .exceptions import ValidationError

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Receiver',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Receiver:
    ''' Receive wire message fragments and assemble complete Bokeh server
    message objects.

    On ``MessageError`` or ``ValidationError``, the receiver will reset its
    state and attempt to consume a new message.

    The *fragment* received can be either bytes or unicode, depending on
    the transport's semantics (WebSocket allows both).

    .. code-block:: python

        [
            # these are required
            b'{header}',        # serialized header dict
            b'{metadata}',      # serialized metadata dict
            b'{content},        # serialized content dict

            # these are optional, and come in pairs; header contains num_buffers
            b'{buf_header}',    # serialized buffer header dict
            b'array'            # raw buffer payload data
            ...
        ]

    The ``header`` fragment will have the form:

    .. code-block:: python

        header = {
            # these are required
            'msgid'       : <str> # a unique id for the message
            'msgtype'     : <str> # a message type, e.g. 'ACK', 'PATCH-DOC', etc

            # these are optional
            'num_buffers' : <int> # the number of additional buffers, if any
        }

    The ``metadata`` fragment may contain any arbitrary information. It is not
    processed by Bokeh for any purpose, but may be useful for external
    monitoring or instrumentation tools.

    The ``content`` fragment is defined by the specific message type.

    '''

    def __init__(self, protocol):
        ''' Configure a Receiver with a specific Bokeh protocol.

        Args:
            protocol (Protocol) :
                A Bokeh protocol object to use to assemble collected message
                fragments.
        '''
        self._protocol = protocol
        self._current_consumer = self._HEADER
        self._message = None
        self._buf_header = None

    async def consume(self, fragment):
        ''' Consume individual protocol message fragments.

        Args:
            fragment (``JSON``) :
                A message fragment to assemble. When a complete message is
                assembled, the receiver state will reset to begin consuming a
                new message.

        '''
        self._current_consumer(fragment)
        return self._message

    def _HEADER(self, fragment):
        self._assume_text(fragment)
        self._message = None
        self._partial = None
        self._fragments = [fragment]
        self._current_consumer = self._METADATA

    def _METADATA(self, fragment):
        self._assume_text(fragment)
        self._fragments.append(fragment)
        self._current_consumer = self._CONTENT

    def _CONTENT(self, fragment):
        self._assume_text(fragment)
        self._fragments.append(fragment)

        header_json, metadata_json, content_json = self._fragments[:3]

        self._partial = self._protocol.assemble(header_json, metadata_json, content_json)

        self._check_complete()

    def _BUFFER_HEADER(self, fragment):
        self._assume_text(fragment)
        self._buf_header = fragment
        self._current_consumer = self._BUFFER_PAYLOAD

    def _BUFFER_PAYLOAD(self, fragment):
        self._assume_binary(fragment)
        self._partial.assemble_buffer(self._buf_header, fragment)

        self._check_complete()

    def _check_complete(self):
        if self._partial.complete:
            self._message = self._partial
            self._current_consumer = self._HEADER
        else:
            self._current_consumer = self._BUFFER_HEADER

    def _assume_text(self, fragment):
        if not isinstance(fragment, str):
            raise ValidationError("expected text fragment but received binary fragment for %s" % (self._current_consumer.__name__))

    def _assume_binary(self, fragment):
        if not isinstance(fragment, bytes):
            raise ValidationError("expected binary fragment but received text fragment for %s" % (self._current_consumer.__name__))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
