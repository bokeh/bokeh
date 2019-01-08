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
from ..message import Message
from . import register

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'server_info_req_1',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@register
class server_info_req_1(Message):
    ''' Define the ``SERVER-INFO-REQ`` message (revision 1) for requesting a
    Bokeh server provide information about itself.

    The ``content`` fragment of for this message is empty.

    '''

    msgtype   = 'SERVER-INFO-REQ'
    revision = 1

    @classmethod
    def create(cls, **metadata):
        ''' Create an ``SERVER-INFO-REQ`` message

        Any keyword arguments will be put into the message ``metadata``
        fragment as-is.

        '''
        header = cls.create_header()
        content = {}
        return cls(header, metadata, content)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
