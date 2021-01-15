#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import json

# External imports
from tornado.web import authenticated

# Bokeh imports
from .auth_mixin import AuthMixin
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

class MetadataHandler(SessionHandler, AuthMixin):
    ''' Implements a custom Tornado handler for document display page

    '''

    @authenticated
    async def get(self, *args, **kwargs):
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
