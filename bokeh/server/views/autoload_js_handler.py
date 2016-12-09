''' Provide a request handler that returns a page displaying a document.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado import gen

from bokeh.core.templates import AUTOLOAD_JS
from bokeh.util.string import encode_utf8
from bokeh.embed import _script_for_render_items

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

        # TODO: yes, this should resuse code from bokeh.embed more directly
        render_items = [dict(sessionid=session.id, elementid=element_id, use_for_title=False)]
        script = _script_for_render_items(None, render_items, websocket_url=websocket_url, wrap_script=False)

        js = AUTOLOAD_JS.render(
            js_urls = resources.js_files,
            css_urls = resources.css_files,
            js_raw = resources.js_raw + [script],
            css_raw = resources.css_raw_str,
            elementid = element_id,
        )

        self.set_header("Content-Type", 'application/javascript')
        self.write(encode_utf8(js))
