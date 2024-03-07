#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from ..message import Empty, Message

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ack',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class ack(Message[Empty]):
    ''' Define the ``ACK`` message for acknowledging successful client
    connection to a Bokeh server.

    The ``content`` fragment of for this message is empty.

    '''

    msgtype = 'ACK'

    @classmethod
    def create(cls, **metadata: Any) -> ack:
        ''' Create an ``ACK`` message

        Any keyword arguments will be put into the message ``metadata``
        fragment as-is.

        '''
        header = cls.create_header()
        content = Empty()
        return cls(header, metadata, content)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
