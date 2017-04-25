''' Provide a request handler that returns a page displaying a document.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from six.moves.urllib.parse import urlparse
from tornado import gen

from bokeh.core.templates import AUTOLOAD_JS
from bokeh.util.string import encode_utf8
from bokeh.util.compiler import bundle_all_models
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

        app_path = self.get_argument("bokeh-app-path", default="/")
        absolute_url = self.get_argument("bokeh-absolute-url", default=None)

        if absolute_url:
            server_url = '{uri.scheme}://{uri.netloc}/'.format(uri=urlparse(absolute_url))
        else:
            server_url = None
        resources = self.application.resources(server_url)

        bundle = bundle_all_models()

        render_items = [dict(sessionid=session.id, elementid=element_id, use_for_title=False)]
        script = _script_for_render_items(None, render_items, app_path=app_path, absolute_url=absolute_url)

        js = AUTOLOAD_JS.render(
            js_urls = resources.js_files,
            css_urls = resources.css_files,
            js_raw = resources.js_raw + [bundle, script],
            css_raw = resources.css_raw_str,
            elementid = element_id,
        )

        self.set_header("Content-Type", 'application/javascript')
        self.write(encode_utf8(js))
