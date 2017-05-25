from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado import gen

from bokeh.core.templates import JS_RESOURCES
from bokeh.util.string import encode_utf8

from .session_handler import SessionHandler

class ResourcesJsHandler(SessionHandler):

    def __init__(self, tornado_app, *args, **kw):
        super(ResourcesJsHandler, self).__init__(tornado_app, *args, **kw)

    def initialize(self, *args, **kw):
        pass

    @gen.coroutine
    def get(self, *args, **kwargs):
        session = yield self.get_session()
        
        resources = self.application.resources(self.request)

        js = JS_RESOURCES.render(
            js_urls=resources.js_files,
            js_raw=resources.js_raw
        )

        self.set_header('Content-Type', 'application/javascript')
        self.write(encode_utf8(js))
