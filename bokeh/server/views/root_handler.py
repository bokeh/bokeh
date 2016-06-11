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

    def initialize(self, *args, **kw):
        self.applications = kw["applications"]
        self.prefix = kw["prefix"]
        self.use_redirect = kw["use_redirect"]

    @gen.coroutine
    def get(self, *args, **kwargs):
        if self.use_redirect and len(self.applications) == 1:
            app_names = list(self.applications.keys())
            redirect_to = (self.prefix if self.prefix else "") + app_names[0]
            self.redirect(redirect_to)
        else:
            self.render("app_index.html", items=self.applications.keys())
