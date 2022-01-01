#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a Request handler that lists the application (if more than one)
or (if only one) redirects to the route of that applications.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from tornado.web import RequestHandler, authenticated

# Bokeh imports
from .auth_mixin import AuthMixin

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'RootHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class RootHandler(AuthMixin, RequestHandler):
    ''' Implements a custom Tornado handler to display the available applications
    If only one application it redirects to that application route
    '''

    def initialize(self, *args, **kw):
        self.applications = kw["applications"]
        self.prefix = kw["prefix"]
        self.index = kw["index"]
        self.use_redirect = kw["use_redirect"]

    @authenticated
    async def get(self, *args, **kwargs):
        prefix = "" if self.prefix is None else self.prefix
        if self.use_redirect and len(self.applications) == 1:
            app_names = list(self.applications.keys())
            redirect_to = prefix + app_names[0]
            self.redirect(redirect_to)
        else:
            index = "app_index.html" if self.index is None else self.index
            self.render(index, prefix=prefix, items=sorted(self.applications.keys()))

    # NOTE: The methods below exist on both AuthMixin and RequestHandler. This
    # makes it explicit which of the versions is intended to be called.
    get_login_url = AuthMixin.get_login_url
    get_current_user = AuthMixin.get_current_user
    prepare = AuthMixin.prepare

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
