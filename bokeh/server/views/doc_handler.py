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
        self.bokeh_application = kw['bokeh_application']
        self.bokeh_websocket_path = kw['bokeh_websocket_path']
        # Note: tornado_app is stored as self.application
        super(DocHandler, self).__init__(tornado_app, *args, **kw)

    def initialize(self, *args, **kw):
        pass

    def get(self, *args, **kwargs):
        session_id = str(uuid.uuid4())
        self.application.create_session_if_needed(self.bokeh_application, session_id)
        session = self.application.get_session(session_id)

        # TODO (havocp) we should add a "title" property to Document probably
        page = server_html_page_for_session(session_id, self.application.resources, "Bokeh App", websocket_path=self.bokeh_websocket_path)

        self.write(page)
