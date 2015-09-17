#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import tempfile

from bokeh.session import TestSession as Session

from bokeh.server.app import bokeh_app, app
from bokeh.server.models import user
from bokeh.util.testing import FlaskClientTestCase


class TestMultiUserAuth(FlaskClientTestCase):
    options = {'multi_user' : True}
    def test_register(self):
        sess = Session(client=app.test_client())
        sess.register('testuser1', 'testpassword1')
        sess.userinfo['username'] == 'testuser1'

    def test_register_twice_should_fail(self):
        sess = Session(client=app.test_client())
        sess.register('testuser1', 'testpassword1')
        self.assertRaises(RuntimeError, sess.register, 'testuser1', 'testpassword1')

    def test_login1(self):
        username = "testuser2"
        password = "fluffy"
        user.new_user(bokeh_app.servermodel_storage, username, password)
        sess = Session(client=app.test_client())
        #have not logged in yet, so userinfo should return http error
        self.assertRaises(Exception, lambda : sess.userinfo)

        #try logging in with wrong password, should be 403
        self.assertRaises(Exception, sess.login, 'testuser2', 'wrong password')

        #actually login
        sess.login('testuser2', 'fluffy')
        assert sess.userinfo['username'] == 'testuser2'

    def test_register_configuration(self):
        #create a dummy config file
        config = tempfile.mkdtemp()
        #create server
        server = Session(name="foo",
                         client=app.test_client(),
                         configdir=config,
                         load_from_config=True)
        assert server.userapikey == "nokey"
        #register a user
        server.register("testuser", "fluffy")
        assert server.userapikey and server.userapikey != "nokey"
        server2 = Session(name="foo",
                          client=app.test_client(),
                          configdir=config,
                          load_from_config=True)
        assert server2.userapikey == server.userapikey
        assert server2.root_url == server.root_url

    def test_login_configuration(self):
        pass

    def test_login2(self):
        #create a server config, register a user
        config1 = tempfile.mkdtemp()
        server = Session(name="foo",
                         client=app.test_client(),
                         configdir=config1,
                         load_from_config=True)
        assert server.userapikey == "nokey"
        server.register("testuser", "fluffy")
        assert server.userapikey and server.userapikey != "nokey"

        config2 = tempfile.mkdtemp()
        server2 = Session(name="foo",
                          client=app.test_client(),
                          configdir=config2,
                          load_from_config=True)
        assert server2.userapikey == "nokey"
        server2.login("testuser", "fluffy")
        #make sure the userapikeys match
        assert server2.userapikey == server.userapikey
