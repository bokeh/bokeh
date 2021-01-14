#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..exceptions import ProtocolError
from ..message import Message

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'push_doc',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class push_doc(Message):
    ''' Define the ``PUSH-DOC`` message for pushing Documents from clients to a
    Bokeh server.

    The ``content`` fragment of for this message is has the form:

    .. code-block:: python

        {
            'doc' : <Document JSON>
        }

    '''

    msgtype  = 'PUSH-DOC'

    def __init__(self, header, metadata, content):
        super().__init__(header, metadata, content)

    @classmethod
    def create(cls, document, **metadata):
        '''

        '''
        header = cls.create_header()

        content = { 'doc' : document.to_json() }

        msg = cls(header, metadata, content)

        return msg

    def push_to_document(self, doc):
        '''

        Raises:
            ProtocolError

        '''
        if 'doc' not in self.content:
            raise ProtocolError("No doc in PUSH-DOC")
        doc.replace_with_json(self.content['doc'])

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
