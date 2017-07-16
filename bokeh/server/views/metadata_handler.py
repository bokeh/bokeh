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
    def __init__(self, tornado_app, *args, **kw):
        super(MetadataHandler, self).__init__(tornado_app, *args, **kw)

    def initialize(self, *args, **kw):
        pass

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
