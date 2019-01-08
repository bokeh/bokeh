#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

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
from ..exceptions import ProtocolError

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'index',
    'register',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

index = {}

def register(cls):
    ''' Decorator to add a Message (and its revision) to the Protocol index.

    Example:

        .. code-block:: python

            @register
            class some_msg_1(Message):

                msgtype  = 'SOME-MSG'
                revision = 1

                @classmethod
                def create(cls, **metadata):
                    header = cls.create_header()
                    content = {}
                    return cls(header, metadata, content)

    '''
    key = (cls.msgtype, cls.revision)
    if key in index:
        raise ProtocolError("Duplicate message specification encountered: %r" % key)
    index[key] = cls
    return cls

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

from .ack import *
from .event import *
from .ok import *
from .patch_doc import *
from .pull_doc_req import *
from .pull_doc_reply import *
from .push_doc import *
from .error import *
from .server_info_reply import *
from .server_info_req import *
