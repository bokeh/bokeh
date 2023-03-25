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
from ..message import Empty, Message

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'pull_doc_req',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class pull_doc_req(Message[Empty]):
    ''' Define the ``PULL-DOC-REQ`` message for requesting a Bokeh server reply
    with a new Bokeh Document.

    The ``content`` fragment of for this message is empty.

    '''

    msgtype = 'PULL-DOC-REQ'

    @classmethod
    def create(cls, **metadata: Any) -> pull_doc_req:
        ''' Create an ``PULL-DOC-REQ`` message

        Any keyword arguments will be put into the message ``metadata``
        fragment as-is.

        '''
        header = cls.create_header()
        return cls(header, metadata, Empty())

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
