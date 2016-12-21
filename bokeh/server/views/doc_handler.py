''' Provide a request handler that returns a page displaying a document.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado import gen

from bokeh.embed import server_html_page_for_session

from .session_handler import SessionHandler

class DocHandler(SessionHandler):
    ''' Implements a custom Tornado handler for document display page

    '''
    def __init__(self, tornado_app, *args, **kw):
        super(DocHandler, self).__init__(tornado_app, *args, **kw)

    def initialize(self, *args, **kw):
        pass

    @gen.coroutine
    def get(self, *args, **kwargs):
        session = yield self.get_session()

        websocket_url = self.application.websocket_url_for_request(self.request, self.bokeh_websocket_path)
        page = server_html_page_for_session(session.id, self.application.resources(self.request),
                                            title=session.document.title,
                                            template=session.document.template,
                                            websocket_url=websocket_url,
                                            template_variables=session.document.template_variables)

        self.set_header("Content-Type", 'text/html')
        self.write(page)
