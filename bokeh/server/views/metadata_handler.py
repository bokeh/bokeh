''' Provide a request handler that returns a json
    with metadata information from the application

'''
from __future__ import absolute_import, print_function

import json
import logging
log = logging.getLogger(__name__)

from tornado import gen

from .session_handler import SessionHandler

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
