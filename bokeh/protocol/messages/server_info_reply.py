#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh import __version__

from ..message import Message
from . import register

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'server_info_reply_1',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@register
class server_info_reply_1(Message):
    ''' Define the ``SERVER-INFO-REPLY`` message (revision 1) for replying to
    Server info requests from clients.

    The ``content`` fragment of for this message is has the form:

    .. code-block:: python

        {
            'version_info' : {
                'bokeh'  : <bokeh library version>
                'server' : <bokeh server version>
            }
        }

    '''

    msgtype  = 'SERVER-INFO-REPLY'
    revision = 1

    @classmethod
    def create(cls, request_id, **metadata):
        ''' Create an ``SERVER-INFO-REPLY`` message

        Args:
            request_id (str) :
                The message ID for the message that issues the info request

        Any additional keyword arguments will be put into the message
        ``metadata`` fragment as-is.

        '''
        header = cls.create_header(request_id=request_id)
        content = {
            'version_info': _VERSION_INFO,
        }
        return cls(header, metadata, content)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_VERSION_INFO = {
    'bokeh'  : __version__,
    'server' : __version__,
}

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
