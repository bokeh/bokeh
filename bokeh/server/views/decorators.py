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
