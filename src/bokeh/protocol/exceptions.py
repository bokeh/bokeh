#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide named exceptions having to do with handling Bokeh Protocol
messages.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'MessageError',
    'ProtocolError',
    'ValidationError',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class ProtocolError(Exception):
    ''' Indicate an error processing the Bokeh wire protocol. '''
    pass

class MessageError(ProtocolError):
    ''' Indicate an error in constructing a Bokeh Message object.

    This exception usually indicates that the JSON fragments of a message
    cannot be decoded at all.

    '''
    pass

class ValidationError(ProtocolError):
    ''' Indicate an error validating wire protocol fragments.

    This exception typically indicates that a binary message fragment was
    received when a text fragment was expected, or vice-versa.

    '''
    pass

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
