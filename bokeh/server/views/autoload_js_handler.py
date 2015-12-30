''' Provide a request handler that returns a page displaying a document.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado import gen
from tornado.web import RequestHandler

from bokeh.core.templates import AUTOLOAD_JS
from bokeh.util.string import encode_utf8

from .session_handler import SessionHandler

class AutoloadJsHandler(SessionHandler):
    ''' Implements a custom Tornado handler for the autoload JS chunk

    '''
    def __init__(self, tornado_app, *args, **kw):
        super(AutoloadJsHandler, self).__init__(tornado_app, *args, **kw)

    def initialize(self, *args, **kw):
        pass

    @gen.coroutine
    def get(self, *args, **kwargs):
        session = yield self.get_session()

        element_id = self.get_argument("bokeh-autoload-element", default=None)
        if not element_id:
            self.send_error(status_code=400, reason='No bokeh-autoload-element query parameter')
            return

        resources = self.application.resources(self.request)
        websocket_url = self.application.websocket_url_for_request(self.request, self.bokeh_websocket_path)

        js = AUTOLOAD_JS.render(
            docs_json = None,
            js_urls = resources.js_files,
            css_files = resources.css_files,
            elementid = element_id,
            sessionid = session.id,
            websocket_url = websocket_url
        )

        self.set_header("Content-Type", 'application/javascript')
        self.write(encode_utf8(js))
