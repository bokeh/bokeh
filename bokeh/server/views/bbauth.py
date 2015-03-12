from __future__ import absolute_import

import logging
from functools import wraps

from flask import abort, jsonify

from ..app import bokeh_app
from ..models import docs
from ...exceptions import AuthenticationException

logger = logging.getLogger(__name__)

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
        if bokeh_app.authentication.can_read_doc(docid):
            return func(docid, *args, **kwargs)
        else:
            abort(401)
    return wrapper

def check_write_authentication(func):
    @wraps(func)
    def wrapper(docid, *args, **kwargs):
        if bokeh_app.authentication.can_write_doc(docid):
            return func(docid, *args, **kwargs)
        else:
            abort(401)
    return wrapper

@bokeh_app.route('/bokeh/login', methods=['GET'])
def login_get():
    ''' Log in a user from a form.

    :status 200: render login view

    '''
    return bokeh_app.authentication.login_get()

@bokeh_app.route('/bokeh/login', methods=['POST'])
def login_post():
    ''' Log in user from a submission.

    :status 200: if API flag set, log in status
    :status 302: if API flag not set, redirect to index on
        success, to login on failue

    '''
    return bokeh_app.authentication.login_post()

@bokeh_app.route('/bokeh/loginfromapikey', methods=['GET'])
def login_from_apikey():
    ''' Log in a user from an API key.

    :status 302: redirect to index on success, to login on failure

    '''
    return bokeh_app.authentication.login_from_apikey()

@bokeh_app.route('/bokeh/register', methods=['GET'])
def register_get():
    ''' Register a new user via a view.

    :status 200: render registration form

    '''
    return bokeh_app.authentication.register_get()

@bokeh_app.route('/bokeh/register', methods=['POST'])
def register_post():
    ''' Register a new user via a submission.

    :status 200: registration result

    '''
    return bokeh_app.authentication.register_post()

@bokeh_app.route('/bokeh/logout')
def logout():
    ''' Log out the current user.

    :status 302: redirect to index

    '''
    return bokeh_app.authentication.logout()

@bokeh_app.route('/bokeh/<docid>/publish', methods=['POST'])
def publish(docid):
    #bokehuser = bokeh_app.current_user()
    doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
    if not bokeh_app.authentication.can_write_doc(docid):
        return abort(401)
    doc.published = True
    doc.save(bokeh_app.servermodel_storage)
    return jsonify(status='success')
