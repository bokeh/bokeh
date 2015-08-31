#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

from bokeh.exceptions import UnauthorizedException

from . import test_utils
from ..app import bokeh_app
from ..models import user

class TestUser(test_utils.BokehServerTestCase):
    def setUp(self):
        super(TestUser, self).setUp()
        self.client = bokeh_app.servermodel_storage

    def test_cant_create_twice(self):
        user.new_user(self.client, 'test@test.com', 'mypassword', docs=[1, 2, 3])
        self.assertRaises(UnauthorizedException, user.new_user,
                          self.client, 'test@test.com', 'mypassword')

    def test_auth_user(self):
        self.assertRaises(UnauthorizedException,
                          user.auth_user,
                          self.client, 'test@test.com', 'mypassword')
        model = user.new_user(self.client, 'test@test.com', 'mypassword')
        assert model.username == 'test@test.com'
        model = user.auth_user(self.client, 'test@test.com', 'mypassword')
        self.assertRaises(UnauthorizedException, user.auth_user,
                          self.client, 'test@test.com', 'wrongpassword')
