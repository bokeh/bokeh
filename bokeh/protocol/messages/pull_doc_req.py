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
    'pull_doc_req_1',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@register
class pull_doc_req_1(Message):
    ''' Define the ``PULL-DOC-REQ`` message (revision 1) for requesting a
    Bokeh server reply with a new Bokeh Document.

    The ``content`` fragment of for this message is empty.

    '''

    msgtype   = 'PULL-DOC-REQ'
    revision = 1

    @classmethod
    def create(cls, **metadata):
        ''' Create an ``PULL-DOC-REQ`` message

        Any keyword arguments will be put into the message ``metadata``
        fragment as-is.

        '''
        header = cls.create_header()
        return cls(header, metadata, {})

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
