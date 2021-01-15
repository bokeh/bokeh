#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a mixin class to add authorization hooks to a request handler.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

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

class AuthMixin:
    ''' This mixin adds the expected Tornado authorization hooks:

    * get_login_url
    * get_current_user
    * prepare

    All of these delegate to the a :class:`~bokeh.serve.auth_provider.AuthProvider`
    confiured on the Bokeh tornado application.

    '''

    def get_login_url(self):
        ''' Delegates to``get_login_url`` method of the auth provider, or the
        ``login_url`` attribute.

        '''
        if self.application.auth_provider.get_login_url is not None:
            return self.application.auth_provider.get_login_url(self)
        if self.application.auth_provider.login_url is not None:
            return self.application.auth_provider.login_url
        raise RuntimeError('login_url or get_login_url() must be supplied when authentication hooks are enabled')

    def get_current_user(self):
        ''' Delegate to the synchronous ``get_user`` method of the auth
        provider

        '''
        if self.application.auth_provider.get_user is not None:
            return self.application.auth_provider.get_user(self)
        return "default_user"

    async def prepare(self):
        ''' Async counterpart to ``get_current_user``

        '''
        if self.application.auth_provider.get_user_async is not None:
            self.current_user = await self.application.auth_provider.get_user_async(self)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
