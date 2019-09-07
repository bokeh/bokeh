'''

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
from os.path import isfile

# External imports
from tornado.web import RequestHandler

# Bokeh imports


#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AuthModule',
    'AuthProvider',
    'NullAuth'
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# TODO (bev) make this an ABC but wait until Bokeh 2 / drop Python 2.7
class AuthProvider(object):
    '''

        login_url (str, optional):
            URL to redirect unathenticated users to for login

        login_hander (type, optional):
            A subclass of RequestHandler that will be installed as a route for
            login_url

            NOTE: login_url must be a relative URL to use login_handler

        get_login_url (callable, optional):
            A function that accepts a tornado RequestHandler and returns a login
            URL for unathenticated users.

            NOTE: login_handler cannot be used together with get_login_url

        get_user (callable, optional):
            A function that accepts a tornado RequestHandler and returns the
            current authenticated user, or None.

        get_user_async (callable, optional):
            An async function that accepts a tornado RequestHandler and returns
            then current authenticated user, or None

    '''

    def __init__(self):
        '''

        '''
        self._validate()

    @property
    def endpoints(self):
        endpoints = []
        if self.login_handler:
            endpoints.append((self.login_url, self.login_handler))
        if self.logout_handler:
            endpoints.append((self.logout_url, self.logout_handler))
        return endpoints

    def _validate(self):
        if self.get_user and self.get_user_async:
            raise ValueError("Only one of get_user or get_user_async should be supplied")

        if (self.get_user or self.get_user_async) and not (self.login_url or self.get_login_url):
            raise ValueError("When user authentication is enabled, one of login_url or get_login_url must be supplied")

        if (self.get_user or self.get_user_async) and not (self.login_url or self.get_login_url):
            raise ValueError("If a get_user function is provided, login URL must also be provided")
        if self.login_url and self.get_login_url:
            raise ValueError("At most one of login_url or get_login_url should be supplied")
        if self.login_handler and self.get_login_url:
            raise ValueError("LoginHandler cannot be used with a get_login_url() function")
        if self.login_handler and not issubclass(self.login_handler, RequestHandler):
            raise ValueError("LoginHandler must be a Tornado RequestHandler")
        # This just catches some common cases up front, let tornado barf on any others
        if self.login_url and not _probably_relative_url(self.login_url):
            raise ValueError("LoginHandler can only be used with a relative login_url")

        if self.logout_url and self.get_logout_url:
            raise ValueError("At most one of logout_url or get_logout_url should be supplied")
        if self.logout_handler and self.get_logout_url:
            raise ValueError("LogoutHandler cannot be used with get_logout_url() function")
        if self.logout_handler and not issubclass(self.logout_handler, RequestHandler):
            raise ValueError("LoginHandler must be a Tornado RequestHandler")
        # This just catches some common cases up front, let tornado barf on any others
        if self.logout_url and not _probably_relative_url(self.logout_url):
            raise ValueError("LogoutHandler can only be used with a relative login_url")

class AuthModule(AuthProvider):
    '''

    '''

    def __init__(self, module_path):
        if not isfile(module_path):
            raise ValueError()

        self._module = load_auth_module(module_path)

        super(AuthModule, self).__init__()

    @property
    def get_user(self):
        return getattr(self._module, 'get_user', None)

    @property
    def get_user_async(self):
        return getattr(self._module, 'get_user_async', None)

    @property
    def login_url(self):
        return getattr(self._module, 'login_url', None)

    @property
    def get_login_url(self):
        return getattr(self._module, 'get_login_url', None)

    @property
    def login_handler(self):
        return getattr(self._module, 'LoginHandler', None)

    @property
    def logout_url(self):
        return getattr(self._module, 'logout_url', None)

    @property
    def get_logout_url(self):
        return getattr(self._module, 'get_logout_url', None)

    @property
    def logout_handler(self):
        return getattr(self._module, 'LogoutHandler', None)

class NullAuth(AuthProvider):
    '''

    '''
    @property
    def get_user(self):
        return None

    @property
    def get_user_async(self):
        return None

    @property
    def login_url(self):
        return None

    @property
    def get_login_url(self):
        return None

    @property
    def login_handler(self):
        return None

    @property
    def logout_url(self):
        return None

    @property
    def get_logout_url(self):
        return None

    @property
    def logout_handler(self):
        return None

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def load_auth_module(module_path):
    '''

    '''
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("bokeh.auth", module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

    except ImportError:
        try:
            # python 3.4
            from importlib.machinery import SourceFileLoader
            module = SourceFileLoader("module.name", module_path).load_module()

        except ImportError:
            # python 2
            import imp
            module = imp.load_source('module.name', module_path)

    return module

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _probably_relative_url(url):
    return not (url.startswith("http:") or url.startswith("https:") or url.startswith("//"))

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
