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
        if len(self.applications) == 1:
            app_names = list(self.applications.keys())
            redirect_to = (self.prefix if self.prefix else "") + app_names[0]
            self.redirect(redirect_to)
        else:
            self.render("app_index.html", items=self.applications.keys())
