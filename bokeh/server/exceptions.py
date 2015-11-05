''' Provide named exceptions having to do with Bokeh Server operation.

'''
from __future__ import absolute_import

class MessageError(Exception):
    ''' Indicate an error in constructing a Bokeh Message object.

    '''
    pass

class ProtocolError(Exception):
    ''' Indicate an error in processing wire protocol fragments.

    '''
    pass

class ValidationError(Exception):
    ''' Indicate an error validating wire protocol fragments.

    '''
    pass
