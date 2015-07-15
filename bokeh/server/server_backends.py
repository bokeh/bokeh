#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__name__)

import uuid

from bokeh.exceptions import UnauthorizedException
from flask import (
    request, session, flash, redirect, url_for, render_template, jsonify
)

from .app import bokeh_app
from .models import user, docs, convenience

class AbstractAuthentication(object):
    def current_user_name(self):
        """obtain current user name from the current request
        current request is obtained from flask request thread local
        object
        """
        raise NotImplementedError
    def login(self, username):
        """login the user, sets whatever request information is necessary
        (usually, session['username'] = username)
        """
        raise NotImplementedError

    def logout(self):
        """logs out the user, sets whatever request information is necessary
        usually, session.pop('username')
        """
        raise NotImplementedError

    def current_user(self):
        """returns bokeh User object from self.current_user_name
        """
        username = self.current_user_name()
        if username is None:
            return None
        bokehuser = user.User.load(bokeh_app.servermodel_storage, username)
        return bokehuser

    def login_get(self):
        """custom login view
        """
        raise NotImplementedError

    def login_post(self):
        """custom login submission. Request form will have
        username, password, and possibly an api field.
        api indicates that we are
        submitting via python, and we should try to return error
        codes rather than flash messages
        """
        raise NotImplementedError

    def login_from_apikey(self):
        """login URL using apikey.  This is usually generated
        by the python client
        """
        raise NotImplementedError

    def register_get(self):
        """custom register view
        """
        raise NotImplementedError

    def register_post(self):
        """custom register submission
        request form will have username, password, password_confirm,
        and possibly an api field. api indicates that we are
        submitting via python, and we should try to return error
        codes rather than flash messages
        """
        raise NotImplementedError

    def can_write_doc(self, docid):
        """whether or not a user can write to a doc
        """
        raise NotImplementedError

    def can_read_doc(self, docid):
        """whether or not a user can read a doc
        """
        raise NotImplementedError

class SingleUserAuthentication(AbstractAuthentication):
    def can_write_doc(self, doc_or_docid, temporary_docid=None, userobj=None):
        return True

    def can_read_doc(self, doc_or_docid, temporary_docid=None, userobj=None):
        return True

    def current_user_name(self):
        return "defaultuser"

    def current_user(self):
        """returns bokeh User object matching defaultuser
        if the user does not exist, one will be created
        """
        username = self.current_user_name()
        bokehuser = user.User.load(bokeh_app.servermodel_storage, username)
        if bokehuser is not None:
            return bokehuser
        bokehuser = user.new_user(bokeh_app.servermodel_storage, "defaultuser",
                                  str(uuid.uuid4()), apikey='nokey', docs=[])
        return bokehuser

class MultiUserAuthentication(AbstractAuthentication):
    def can_write_doc(self, doc_or_docid, temporary_docid=None, userobj=None):
        if not isinstance(doc_or_docid, docs.Doc):
            doc = docs.Doc.load(bokeh_app.servermodel_storage, doc_or_docid)
        else:
            doc = doc_or_docid
        if userobj is None:
            userobj = self.current_user()
        return convenience.can_write_from_request(doc, request, userobj,
                                                  temporary_docid=temporary_docid)

    def can_read_doc(self, doc_or_docid, temporary_docid=None, userobj=None):
        if not isinstance(doc_or_docid, docs.Doc):
            doc = docs.Doc.load(bokeh_app.servermodel_storage, doc_or_docid)
        else:
            doc = doc_or_docid
        if userobj is None:
            userobj = self.current_user()
        return convenience.can_read_from_request(doc, request, userobj)


    def login(self, username):
        session['username'] = username

    def print_connection_info(self, bokehuser):
        logger.info("connect using the following")
        command = "output_server(docname, username='%s', userapikey='%s')"
        command = command % (bokehuser.username, bokehuser.apikey)
        logger.info(command)

    def current_user_name(self):
        # users can be authenticated by logging in (setting the session)
        # or by setting fields in the http header (api keys, etc..)
        username =  session.get('username', None)
        if username:
            return username
        else:
            # check for auth via apis and headers
            bokehuser = user.apiuser_from_request(bokeh_app, request)
            if bokehuser:
                return bokehuser.username
        return None

    def register_get(self):
        return render_template("register.html", title="Register")

    def login_get(self):
        return render_template("login.html", title="Login")

    def register_post_api(self):
        username = request.values['username']
        password = request.values['password']
        try:
            bokehuser = user.new_user(
                bokeh_app.servermodel_storage, username, password
                )
            self.login(username)
            self.print_connection_info(bokehuser)
        except UnauthorizedException:
            return jsonify(status=False,
                           error="user already exists")
        return jsonify(status=True,
                       userapikey=bokehuser.apikey
                       )

    def register_post(self):
        if request.values.get('api', None):
            return self.register_post_api()
        username = request.values['username']
        password = request.values['password']
        password_confirm = request.values['password_confirm']
        if password != password_confirm:
            flash("password and confirmation do not match")
            return redirect(url_for('.register_get'))
        try:
            bokehuser = user.new_user(
                bokeh_app.servermodel_storage, username, password
                )
            self.login(username)
            self.print_connection_info(bokehuser)
        except UnauthorizedException:
            flash("user already exists")
            return redirect(url_for('.register_get'))
        return redirect(url_for(".index"))

    def login_post_api(self):
        username = request.values['username']
        password = request.values['password']
        try:
            bokehuser = user.auth_user(bokeh_app.servermodel_storage,
                                       username,
                                       password)
            self.login(username)
            self.print_connection_info(bokehuser)
        except UnauthorizedException:
            return jsonify(status=False,
                           error="incorrect login ")
        return jsonify(status=True,
                       userapikey=bokehuser.apikey
                       )

    def login_post(self):
        if request.values.get('api', None):
            return self.login_post_api()
        username = request.values['username']
        password = request.values['password']
        try:
            bokehuser = user.auth_user(bokeh_app.servermodel_storage,
                                       username,
                                       password=password)
            self.login(username)
            self.print_connection_info(bokehuser)
        except UnauthorizedException:
            flash("incorrect login exists")
            return redirect(url_for('.login_get'))
        return redirect(url_for(".index"))

    def login_from_apikey(self):
        username = request.values.get('username')
        apikey = request.values.get('userapikey')
        try:
            bokehuser = user.auth_user(bokeh_app.servermodel_storage,
                                       username,
                                       apikey=apikey)

            self.login(username)
            self.print_connection_info(bokehuser)
        except UnauthorizedException:
            flash("incorrect login")
            return redirect(url_for('.login_get'))
        return redirect(url_for(".index"))

    def logout(self):
        session.pop('username', None)
        return redirect(url_for(".index"))
