#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from ...core.types import ID
from ..message import Empty, Message

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ok',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class ok(Message[Empty]):
    ''' Define the ``OK`` message for acknowledging successful handling of a
    previous message.

    The ``content`` fragment of for this message is empty.

    '''

    msgtype = 'OK'

    @classmethod
    def create(cls, request_id: ID, **metadata: Any) -> ok:
        ''' Create an ``OK`` message

        Args:
            request_id (str) :
                The message ID for the message the precipitated the OK.

        Any additional keyword arguments will be put into the message
        ``metadata`` fragment as-is.

        '''
        header = cls.create_header(request_id=request_id)
        return cls(header, metadata, Empty())

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
