#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

from flask import abort, jsonify

from ..blueprint import bokeh_blueprint
from ..models import docs

@bokeh_blueprint.route('/bokeh/login', methods=['GET'])
def login_get():
    ''' Log in a user from a form.

    :status 200: render login view

    '''
    return bokeh_blueprint.authentication.login_get()

@bokeh_blueprint.route('/bokeh/login', methods=['POST'])
def login_post():
    ''' Log in user from a submission.

    :status 200: if API flag set, log in status
    :status 302: if API flag not set, redirect to index on
        success, to login on failue

    '''
    return bokeh_blueprint.authentication.login_post()

@bokeh_blueprint.route('/bokeh/loginfromapikey', methods=['GET'])
def login_from_apikey():
    ''' Log in a user from an API key.

    :status 302: redirect to index on success, to login on failure

    '''
    return bokeh_blueprint.authentication.login_from_apikey()

@bokeh_blueprint.route('/bokeh/register', methods=['GET'])
def register_get():
    ''' Register a new user via a view.

    :status 200: render registration form

    '''
    return bokeh_blueprint.authentication.register_get()

@bokeh_blueprint.route('/bokeh/register', methods=['POST'])
def register_post():
    ''' Register a new user via a submission.

    :status 200: registration result

    '''
    return bokeh_blueprint.authentication.register_post()

@bokeh_blueprint.route('/bokeh/logout')
def logout():
    ''' Log out the current user.

    :status 302: redirect to index

    '''
    return bokeh_blueprint.authentication.logout()

@bokeh_blueprint.route('/bokeh/<docid>/publish', methods=['POST'])
def publish(docid):
    #bokehuser = bokeh_blueprint.current_user()
    doc = docs.Doc.load(bokeh_blueprint.servermodel_storage, docid)
    if not bokeh_blueprint.authentication.can_write_doc(docid):
        return abort(401)
    doc.published = True
    doc.save(bokeh_blueprint.servermodel_storage)
    return jsonify(status='success')
