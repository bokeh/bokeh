''' Provide named exceptions having to do with handling Bokeh Protocol
messages.

'''
from __future__ import absolute_import

class MessageError(Exception):
    ''' Indicate an error in constructing a Bokeh Message object.

    This exception usually indicates that the JSON fragments of a message
    cannot be decoded at all.

    '''
    pass

class ProtocolError(Exception):
    ''' Indicate an error in processing wire protocol fragments.

    This exception indicates that decoded message fragments cannot be properly
    assembled.

    '''
    pass

class ValidationError(Exception):
    ''' Indicate an error validating wire protocol fragments.

    This exception typically indicates that a binary message fragment was
    received when a text fragment was expected, or vice-versa.

    '''
    pass
