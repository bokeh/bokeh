''' Provide a request handler that returns a page displaying a document.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

import uuid

from tornado import gen
from tornado.web import RequestHandler

from bokeh.embed import server_html_page_for_session

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
            session_id = str(uuid.uuid4())
        self.application_context.create_session_if_needed(session_id)

        websocket_url = self.application.websocket_url_for_request(self.request, self.bokeh_websocket_path)
        # TODO (havocp) we should add a "title" property to Document probably
        page = server_html_page_for_session(session_id, self.application.resources(self.request),
                                            "Bokeh App", websocket_url=websocket_url)

        self.set_header("Content-Type", 'text/html')
        self.write(page)
