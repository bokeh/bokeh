#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a web socket handler for the Bokeh Server application.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from tornado import gen

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AuthMixin',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class AuthMixin(object):
    '''

    '''

    def get_login_url(self):
        '''

        '''
        if self.application.get_login_url:
            return self.application.get_login_url(self)
        if self.application.login_url:
            return self.application.login_url
        raise RuntimeError('login_url or get_login_url() must be supplied when authentication hooks are enabled')

    def get_current_user(self):
        '''

        '''
        if self.application.get_user:
            return self.application.get_user(self)
        return "default_user"

    @gen.coroutine
    def prepare(self):
        '''

        '''
        if self.application.get_user_async:
            self.current_user = yield self.application.get_user_async(self)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
