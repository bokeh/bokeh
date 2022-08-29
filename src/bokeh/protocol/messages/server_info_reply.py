#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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
from typing import Any, TypedDict

# Bokeh imports
from bokeh import __version__

# Bokeh imports
from ...core.types import ID
from ..message import Message

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'server_info_reply',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class VersionInfo(TypedDict):
    bokeh: str
    server: str

class ServerInfo(TypedDict):
    version_info: VersionInfo

class server_info_reply(Message[ServerInfo]):
    ''' Define the ``SERVER-INFO-REPLY`` message for replying to Server info
    requests from clients.

    The ``content`` fragment of for this message is has the form:

    .. code-block:: python

        {
            'version_info' : {
                'bokeh'  : <bokeh library version>
                'server' : <bokeh server version>
            }
        }

    '''

    msgtype = 'SERVER-INFO-REPLY'

    @classmethod
    def create(cls, request_id: ID, **metadata: Any) -> server_info_reply:
        ''' Create an ``SERVER-INFO-REPLY`` message

        Args:
            request_id (str) :
                The message ID for the message that issues the info request

        Any additional keyword arguments will be put into the message
        ``metadata`` fragment as-is.

        '''
        header = cls.create_header(request_id=request_id)
        content = ServerInfo(version_info=_VERSION_INFO)
        return cls(header, metadata, content)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_VERSION_INFO = VersionInfo(
    bokeh  = __version__,
    server = __version__,
)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
