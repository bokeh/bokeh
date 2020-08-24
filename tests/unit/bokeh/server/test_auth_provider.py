#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from types import ModuleType

# External imports
from tornado.web import RequestHandler

# Bokeh imports
from bokeh._testing.util.api import verify_all
from bokeh._testing.util.filesystem import with_file_contents, with_file_contents_async

# Module under test
import bokeh.server.auth_provider as bsa # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'AuthModule',
    'AuthProvider',
    'NullAuth'
)

@pytest.fixture
def null_auth():
    return bsa.NullAuth()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bsa, ALL)

class TestNullAuth:
    def test_endpoints(self, null_auth) -> None:
        assert null_auth.endpoints == []

    def test_get_user(self, null_auth) -> None:
        assert null_auth.get_user == None

    async def test_get_user_async(self, null_auth) -> None:
        assert null_auth.get_user_async == None

    def test_login_url(self, null_auth) -> None:
        assert null_auth.login_url == None

    def test_get_login_url(self, null_auth) -> None:
        assert null_auth.get_login_url == None

    def test_login_handler(self, null_auth) -> None:
        assert null_auth.login_handler == None

    def test_logout_url(self, null_auth) -> None:
        assert null_auth.logout_url == None

    def test_logout_handler(self, null_auth) -> None:
        assert null_auth.logout_handler == None

class TestAuthModule_properties:
    def test_no_endpoints(self) -> None:
        def func(filename):
            am = bsa.AuthModule(filename)
            assert am.endpoints == []

        with_file_contents("""
def get_user(): pass
def get_login_url(): pass
        """, func, suffix='.py')

        with_file_contents("""
def get_user(): pass
login_url = "/foo"
        """, func, suffix='.py')

    def test_login_url_endpoint(self) -> None:
        def func(filename):
            am = bsa.AuthModule(filename)
            assert am.endpoints[0][0] == '/foo'
            assert issubclass(am.endpoints[0][1], RequestHandler)
        with_file_contents("""
from tornado.web import RequestHandler
def get_user(): pass
login_url = "/foo"
class LoginHandler(RequestHandler): pass
        """, func, suffix='.py')

    def test_logout_url_endpoint(self) -> None:
        def func(filename):
            am = bsa.AuthModule(filename)
            assert am.endpoints[0][0] == '/bar'
            assert issubclass(am.endpoints[0][1], RequestHandler)
        with_file_contents("""
from tornado.web import RequestHandler
def get_user(): pass
login_url = "/foo"
logout_url = "/bar"
class LogoutHandler(RequestHandler): pass
        """, func, suffix='.py')

    def test_login_logout_url_endpoint(self) -> None:
        def func(filename):
            am = bsa.AuthModule(filename)
            endpoints = sorted(am.endpoints)
            assert endpoints[0][0] == '/bar'
            assert issubclass(endpoints[0][1], RequestHandler)
            assert endpoints[1][0] == '/foo'
            assert issubclass(endpoints[1][1], RequestHandler)
        with_file_contents("""
def get_user(): pass
login_url = "/foo"
from tornado.web import RequestHandler
class LoginHandler(RequestHandler): pass
logout_url = "/bar"
from tornado.web import RequestHandler
class LogoutHandler(RequestHandler): pass
        """, func, suffix='.py')

    def test_get_user(self) -> None:
        def func(filename):
            am = bsa.AuthModule(filename)
            assert am.get_user is not None
            assert am.get_user('handler') == 10

        with_file_contents("""
def get_user(handler): return 10
login_url = "/foo"
        """, func, suffix='.py')

    async def test_get_user_async(self) -> None:
        async def func(filename):
            am = bsa.AuthModule(filename)
            assert am.get_user_async is not None
            assert await am.get_user_async('handler') == 10

        await with_file_contents_async("""
async def get_user_async(handler): return 10
login_url = "/foo"
        """, func, suffix='.py')


    def test_login_url(self) -> None:
        def func(filename):
            am = bsa.AuthModule(filename)
            assert am.login_url == "/foo"
            assert am.get_login_url is None
            assert am.login_handler is None
            assert am.logout_url is None
            assert am.logout_handler is None

        with_file_contents("""
def get_user(handler): return 10
login_url = "/foo"
        """, func, suffix='.py')

    def test_get_login_url(self) -> None:
        def func(filename):
            am = bsa.AuthModule(filename)
            assert am.login_url is None
            assert am.get_login_url('handler') == 20
            assert am.login_handler is None
            assert am.logout_url is None
            assert am.logout_handler is None

        with_file_contents("""
def get_user(handler): return 10
def get_login_url(handler): return 20
        """, func, suffix='.py')

    def test_login_handler(self) -> None:
        def func(filename):
            am = bsa.AuthModule(filename)
            assert am.login_url == "/foo"
            assert am.get_login_url is None
            assert issubclass(am.login_handler, RequestHandler)
            assert am.logout_url is None
            assert am.logout_handler is None

        with_file_contents("""
def get_user(handler): return 10
login_url = "/foo"
from tornado.web import RequestHandler
class LoginHandler(RequestHandler): pass
        """, func, suffix='.py')

    def test_logout_url(self) -> None:
        def func(filename):
            am = bsa.AuthModule(filename)
            assert am.login_url == "/foo"
            assert am.get_login_url is None
            assert am.login_handler is None
            assert am.logout_url == "/bar"
            assert am.logout_handler is None

        with_file_contents("""
def get_user(handler): return 10
login_url = "/foo"
logout_url = "/bar"
        """, func, suffix='.py')

    def test_logout_handler(self) -> None:
        def func(filename):
            am = bsa.AuthModule(filename)
            assert am.login_url == "/foo"
            assert am.get_login_url is None
            assert am.login_handler is None
            assert am.logout_url == "/bar"
            assert issubclass(am.logout_handler, RequestHandler)

        with_file_contents("""
def get_user(handler): return 10
login_url = "/foo"
logout_url = "/bar"
from tornado.web import RequestHandler
class LogoutHandler(RequestHandler): pass
    """, func, suffix='.py')


class TestAuthModule_validation:
    def test_no_file(self) -> None:
        with pytest.raises(ValueError) as e:
            bsa.AuthModule("junkjunkjunk")
            assert str(e).startswith("no file exists at module_path:")

    def test_both_user(self) -> None:
        def func(filename):
            with pytest.raises(ValueError) as e:
                bsa.AuthModule(filename)
                assert str(e) == "Only one of get_user or get_user_async should be supplied"

        with_file_contents("""
def get_user(handler): return 10
async def get_user_async(handler): return 20
    """, func, suffix='.py')

    @pytest.mark.parametrize('user_func', ['get_user', 'get_user_async'])
    def test_no_login(self, user_func) -> None:
        def func(filename):
            with pytest.raises(ValueError) as e:
                bsa.AuthModule(filename)
                assert str(e) == "When user authentication is enabled, one of login_url or get_login_url must be supplied"

        with_file_contents("""
def %s(handler): return 10
    """ % user_func, func, suffix='.py')

    def test_both_login(self) -> None:
        def func(filename):
            with pytest.raises(ValueError) as e:
                bsa.AuthModule(filename)
                assert str(e) == "At most one of login_url or get_login_url should be supplied"

        with_file_contents("""
def get_user(handler): return 10
def get_login_url(handler): return 20
login_url = "/foo"
    """, func, suffix='.py')

    def test_handler_with_get_login_url(self) -> None:
        def func(filename):
            with pytest.raises(ValueError) as e:
                bsa.AuthModule(filename)
                assert str(e) == "LoginHandler cannot be used with a get_login_url() function"

        with_file_contents("""
def get_user(handler): return 10
def get_login_url(handler): return 20
from tornado.web import RequestHandler
class LoginHandler(RequestHandler): pass
    """, func, suffix='.py')

    def test_login_handler_wrong_type(self) -> None:
        def func(filename):
            with pytest.raises(ValueError) as e:
                bsa.AuthModule(filename)
                assert str(e) == "LoginHandler must be a Tornado RequestHandler"

        with_file_contents("""
def get_user(handler): return 10
login_url = "/foo"
class LoginHandler(object): pass
    """, func, suffix='.py')

    @pytest.mark.parametrize('login_url', ['http://foo.com', 'https://foo.com', '//foo.com'])
    def test_login_handler_wrong_url(self, login_url) -> None:
        def func(filename):
            with pytest.raises(ValueError) as e:
                bsa.AuthModule(filename)
                assert str(e) == "LoginHandler can only be used with a relative login_url"

        with_file_contents("""
def get_user(handler): return 10
login_url = %r
    """ % login_url, func, suffix='.py')

    def test_logout_handler_wrong_type(self) -> None:
        def func(filename):
            with pytest.raises(ValueError) as e:
                bsa.AuthModule(filename)
                assert str(e) == "LoginHandler must be a Tornado RequestHandler"

        with_file_contents("""
def get_user(handler): return 10
login_url = "/foo"
class LogoutHandler(object): pass
    """, func, suffix='.py')

    @pytest.mark.parametrize('logout_url', ['http://foo.com', 'https://foo.com', '//foo.com'])
    def test_logout_handler_wrong_url(self, logout_url) -> None:
        def func(filename):
            with pytest.raises(ValueError) as e:
                bsa.AuthModule(filename)
                assert str(e) == "LoginHandler can only be used with a relative login_url"

        with_file_contents("""
def get_user(handler): return 10
logout_url = %r
    """ % logout_url, func, suffix='.py')

_source = """
def get_login_url():
    pass

logout_url = "foo"

class LoginHandler(object):
    pass
"""

def test_load_auth_module() -> None:
    def func(filename):
        m =  bsa.load_auth_module(filename)
        assert isinstance(m, ModuleType)
        assert [x for x in sorted(dir(m)) if not x.startswith("__")] == ['LoginHandler', 'get_login_url', 'logout_url']
    with_file_contents(_source, func, suffix='.py')

def test_probably_relative_url() -> None:
    assert bsa.probably_relative_url("httpabc")
    assert bsa.probably_relative_url("httpsabc")
    assert bsa.probably_relative_url("/abc")
    assert not bsa.probably_relative_url("http://abc")
    assert not bsa.probably_relative_url("https://abc")
    assert not bsa.probably_relative_url("//abc")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
