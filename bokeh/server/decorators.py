#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)

from bokeh.exceptions import AuthenticationException
from datetime import timedelta
from flask import abort
from functools import update_wrapper, wraps

from flask import make_response, request, current_app
from six import string_types

from .blueprint import bokeh_blueprint

def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))

    if headers is not None and not isinstance(headers, string_types):
        headers = ', '.join(x.upper() for x in headers)

    if not isinstance(origin, string_types):
        origin = ', '.join(origin)

    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        return methods
        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        @wraps(f)
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            requested_headers = request.headers.get(
                'Access-Control-Request-Headers'
            )
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            elif requested_headers :
                h['Access-Control-Allow-Headers'] = requested_headers
            return resp
        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)

    return decorator


def handle_auth_error(func):
    """Decorator wraps a function and watches for AuthenticationException
    If one is thrown, log and abort 401 instead
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except AuthenticationException as e:
            logger.exception(e)
            return abort(401)
    return wrapper

def check_read_authentication(func):
    @wraps(func)
    def wrapper(docid, *args, **kwargs):
        if bokeh_blueprint.authentication.can_read_doc(docid):
            return func(docid, *args, **kwargs)
        else:
            abort(401)
    return wrapper

def check_write_authentication(func):
    @wraps(func)
    def wrapper(docid, *args, **kwargs):
        if bokeh_blueprint.authentication.can_write_doc(docid):
            return func(docid, *args, **kwargs)
        else:
            abort(401)
    return wrapper

def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not bokeh_blueprint.current_user():
            return abort(401, "You must be logged in")
        return func(*args, **kwargs)
    return wrapper
