''' Provide a request handler that returns a page displaying a document.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado.web import RequestHandler

from bokeh.templates import AUTOLOAD_JS
from bokeh.util.string import encode_utf8

class AutoloadJsHandler(RequestHandler):
    ''' Implements a custom Tornado handler for the autoload JS chunk

    '''
    def __init__(self, tornado_app, *args, **kw):
        self.application_context = kw['application_context']
        self.bokeh_websocket_path = kw['bokeh_websocket_path']
        # Note: tornado_app is stored as self.application
        super(AutoloadJsHandler, self).__init__(tornado_app, *args, **kw)

    def initialize(self, *args, **kw):
        pass

    def get(self, *args, **kwargs):
        element_id = self.get_argument("bokeh-autoload-element", default=None)
        if not element_id:
            self.send_error(status_code=400, reason='No bokeh-autoload-element query parameter')
            return

        resources = self.application.resources(self.request)
        websocket_url = self.application.websocket_url_for_request(self.request, self.bokeh_websocket_path)

        js = AUTOLOAD_JS.render(
            docs_json = None,
            # TODO we should load all the JS files, but the code
            # in AUTOLOAD_JS isn't smart enough to deal with it.
            js_url = resources.js_files[0],
            css_files = resources.css_files,
            elementid = element_id,
            websocket_url = websocket_url
        )

        self.set_header("Content-Type", 'application/javascript')
        self.write(encode_utf8(js))
