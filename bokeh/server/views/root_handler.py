'''
Provide a Request handler that lists the application (if more than one)
or (if only one) redirects to the route of that applications
'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado import gen

from tornado.web import RequestHandler


class RootHandler(RequestHandler):
    ''' Implements a custom Tornado handler to display the available applications
    If only one application it redirects to that application route
    '''
    def __init__(self, tornado_app, *args, **kw):
        super(RootHandler, self).__init__(tornado_app, *args, **kw)
        # self.applications = None

    def initialize(self, *args, **kw):
        self.applications = kw["applications"]
        self.prefix = kw["prefix"]

    @gen.coroutine
    def get(self, *args, **kwargs):
        self.render("app_index.html", items=self.applications.keys())
