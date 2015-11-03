''' Provide a request handler that returns a page displaying a document.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado.web import StaticFileHandler

from bokeh.settings import settings

class StaticHandler(StaticFileHandler):
    ''' Implements a custom Tornado static file handler

    '''
    def __init__(self, tornado_app, *args, **kw):
        kw['path'] = settings.bokehjsdir()

        # Note: tornado_app is stored as self.application
        super(StaticHandler, self).__init__(tornado_app, *args, **kw)
