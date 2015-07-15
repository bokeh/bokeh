#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

from functools import wraps

from flask import abort

from ..app import bokeh_app

def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not bokeh_app.current_user():
            return abort(401, "You must be logged in")
        return func(*args, **kwargs)
    return wrapper
