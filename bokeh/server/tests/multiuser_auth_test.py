import tempfile

import requests

from . import test_utils
from ..app import bokeh_app
from ..models import user
from ...session import Session
from ...tests.test_utils import skipIfPy3, skipIfPyPy


class TestRegister(test_utils.BokehServerTestCase):
    options = {'single_user_mode': False}

    @skipIfPy3("gevent does not work in py3.")
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_register(self):
        url = "http://localhost:5006/bokeh/register"
        session = requests.session()
        result = session.post(url, data={'username': 'testuser1',
                                         'password': 'mypassword',
                                         'password_confirm': 'mypassword'},
                              allow_redirects=False
                              )
        assert result.status_code == 302
        # we redirect to bokeh on success, but we redirect to
        # /bokeh/register on errror
        assert result.headers["location"] == 'http://localhost:5006/bokeh/'
        url = "http://localhost:5006/bokeh/userinfo"
        userinfo = session.get(url).json()
        assert userinfo['username'] == 'testuser1'

    @skipIfPy3("gevent does not work in py3.")
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_register_twice_should_fail(self):
        url = "http://localhost:5006/bokeh/register"
        session = requests.session()
        result = session.post(url, data={'username': 'testuser1',
                                         'password': 'mypassword',
                                         'password_confirm': 'mypassword'},
                              allow_redirects=False
                              )
        assert result.status_code == 302
        # we redirect to bokeh on success, but we redirect to
        # /bokeh/register on errror
        assert result.headers["location"] == 'http://localhost:5006/bokeh/'

        result = session.post(url, data={'username': 'testuser1',
                                         'password': 'mypassword',
                                         'password_confirm': 'mypassword'},
                              allow_redirects=False
                              )
        assert result.status_code == 302
        # we redirect to bokeh on success, but we redirect to
        # /bokeh/register on errror
        assert result.headers["location"] == 'http://localhost:5006/bokeh/register'


class TestLogin(test_utils.BokehServerTestCase):
    options = {'single_user_mode': False}

    @skipIfPy3("gevent does not work in py3.")
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_login(self):
        username = "testuser2"
        password = "fluffy"
        user.new_user(bokeh_app.servermodel_storage, username, password)
        session = requests.session()

        #haven't logged in yet, so this should  be 403
        url = "http://localhost:5006/bokeh/userinfo"
        result = session.get(url)
        assert result.status_code == 403

        #try logging in with wrong password, should be 403
        url = "http://localhost:5006/bokeh/login"
        result = session.post(url, data={'username': 'testuser2',
                                         'password': 'wrong password'},
                              allow_redirects=False
                              )

        #haven't logged in yet, so this should  be 403
        url = "http://localhost:5006/bokeh/userinfo"
        result = session.get(url)
        assert result.status_code == 403

        #login
        url = "http://localhost:5006/bokeh/login"
        result = session.post(url, data={'username': 'testuser2',
                                         'password': 'fluffy'},
                              allow_redirects=False
                              )

        url = "http://localhost:5006/bokeh/userinfo"
        result = session.get(url).json()
        assert result['username'] == 'testuser2'


class ServerConfigTestCase(test_utils.BokehServerTestCase):
    options = {'single_user_mode': False}

    @skipIfPy3("gevent does not work in py3.")
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_register(self):
        #create a dummy config file
        config = tempfile.mkdtemp()
        #create server
        server = Session(name="foo", root_url="http://localhost:5006/",
                        configdir=config
                        )
        assert server.userapikey == "nokey"
        #register a user
        server.register("testuser", "fluffy")
        assert server.userapikey and server.userapikey != "nokey"
        #create a second server configuration
        #make sure it loads the proper api key
        server2 = Session(name="foo",
                         configdir=config
                         )
        assert server2.userapikey == server.userapikey
        assert server2.root_url == server.root_url

    @skipIfPy3("gevent does not work in py3.")
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_login(self):
        #create a server config, register a user
        config1 = tempfile.mkdtemp()
        server = Session(name="foo", root_url="http://localhost:5006/",
                        configdir=config1
                        )
        assert server.userapikey == "nokey"
        server.register("testuser", "fluffy")
        assert server.userapikey and server.userapikey != "nokey"

        #create a separate server config, login a user
        config2 = tempfile.mkdtemp()
        server2 = Session(name="foo", root_url="http://localhost:5006/",
                         configdir=config2
                         )
        assert server2.userapikey == "nokey"
        server2.login("testuser", "fluffy")
        #make sure the userapikeys match
        assert server2.userapikey == server.userapikey

