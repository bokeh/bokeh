#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

from contextlib import contextmanager

from werkzeug.exceptions import Unauthorized
import pytest

from bokeh.server.app import bokeh_app
from bokeh.server.models.user import User
from bokeh.server.views.decorators import login_required

@contextmanager
def patch_current_user(func):
    old = bokeh_app.current_user
    try:
        bokeh_app.current_user = func
        yield
    finally:
        bokeh_app.current_user = old

def test_login_required():
    @login_required
    def test(x):
        return x
    with patch_current_user(lambda : None):
        with pytest.raises(Unauthorized):
            test()
    with patch_current_user(lambda : User):
        assert test(1) == 1
