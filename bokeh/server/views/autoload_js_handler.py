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
from bokeh.embed.elements import script_for_render_items
from bokeh.embed.util import RenderItem

from .session_handler import SessionHandler

class AutoloadJsHandler(SessionHandler):
    ''' Implements a custom Tornado handler for the autoload JS chunk

    '''
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

        render_items = [RenderItem(sessionid=session.id, elementid=element_id, use_for_title=False)]
        script = script_for_render_items(None, render_items, app_path=app_path, absolute_url=absolute_url)

        resources_param = self.get_argument("resources", "default")
        if resources_param == "none":
            js_urls = []
            css_urls = []
        else:
            js_urls = resources.js_files
            css_urls = resources.css_files

        js = AUTOLOAD_JS.render(
            js_urls = js_urls,
            css_urls = css_urls,
            js_raw = resources.js_raw + [bundle, script],
            css_raw = resources.css_raw_str,
            elementid = element_id,
        )

        self.set_header("Content-Type", 'application/javascript')
        self.write(encode_utf8(js))
