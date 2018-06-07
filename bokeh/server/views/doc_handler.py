''' Provide a request handler that returns a page displaying a document.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado import gen

from bokeh.embed.server import server_html_page_for_session

from .session_handler import SessionHandler

class DocHandler(SessionHandler):
    ''' Implements a custom Tornado handler for document display page

    '''
    @gen.coroutine
    def get(self, *args, **kwargs):
        session = yield self.get_session()

        page = server_html_page_for_session(session,
                                            resources=self.application.resources(),
                                            title=session.document.title,
                                            template=session.document.template,
                                            template_variables=session.document.template_variables)

        self.set_header("Content-Type", 'text/html')
        self.write(page)
