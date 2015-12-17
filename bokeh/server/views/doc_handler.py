''' Provide a request handler that returns a page displaying a document.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado.web import RequestHandler, HTTPError

from bokeh.embed import server_html_page_for_session
from bokeh.settings import settings
from bokeh.util.session_id import generate_session_id, check_session_id_signature

class DocHandler(RequestHandler):
    ''' Implements a custom Tornado handler for document display page

    '''
    def __init__(self, tornado_app, *args, **kw):
        self.application_context = kw['application_context']
        self.bokeh_websocket_path = kw['bokeh_websocket_path']
        # Note: tornado_app is stored as self.application
        super(DocHandler, self).__init__(tornado_app, *args, **kw)

    def initialize(self, *args, **kw):
        pass

    def get(self, *args, **kwargs):
        session_id = self.get_argument("bokeh-session-id", default=None)
        if session_id is None:
            session_id = generate_session_id()
        elif not check_session_id_signature(session_id):
            log.error("Session id had invalid signature: %r", session_id)
            raise HTTPError(status_code=403, reason="Invalid session ID")

        session = self.application_context.create_session_if_needed(session_id)

        websocket_url = self.application.websocket_url_for_request(self.request, self.bokeh_websocket_path)
        page = server_html_page_for_session(session_id, self.application.resources(self.request),
                                            title=session.document.title,
                                            websocket_url=websocket_url)

        self.set_header("Content-Type", 'text/html')
        self.write(page)
