#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a request handler that returns a json
    with metadata information from the application

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
import json

# External imports
from tornado import gen

# Bokeh imports
from .session_handler import SessionHandler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'MetadataHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class MetadataHandler(SessionHandler):
    ''' Implements a custom Tornado handler for document display page

    '''

    @gen.coroutine
    def get(self, *args, **kwargs):
        url = self.application_context.url
        userdata = self.application_context.application.metadata
        if callable(userdata):
            userdata = userdata()
        if userdata is None:
            userdata = {}

        metadata = dict(url=url, data=userdata)

        self.set_header("Content-Type", 'application/json')
        self.write(json.dumps(metadata))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
