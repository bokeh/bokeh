import json
import uuid
from .models import user
from .models import UnauthorizedException
from .app import bokeh_app
from ..exceptions import DataIntegrityException
import logging
logger = logging.getLogger(__name__)

class AbstractBackboneStorage(object):
    """Abstract class, which returns a session object for a given
    document
    """
    def get_session(self, docid, doc=None):
        """pass in the docid of a document.  If doc is passed
        (instance of bokeh.models.doc.Doc), then that instance will be used
        otherwise it will be loaded
        """
        raise NotImplementedError
    
    
class RedisBackboneStorage(object):
    def __init__(self, redisconn):
        self.redisconn = redisconn

    def get_session(self, docid, doc=None):
        from .serverbb import RedisSession
        return RedisSession(self.redisconn, docid, doc=doc)

class AbstractServerModelStorage(object):
    """Storage class for server side models (non backbone, that would be
    document and user classes)
    """
    def get(self, key):
        """given a key returns json objects"""
        raise NotImplementedError
    
    def set(self, key, val):
        """given a key and a json object, saves it"""
        raise NotImplementedError

    def create(self, key, val):
        """given a key and a json object, saves it
        differs from set because this method should check
        to make sure the object doesn't already exist
        """
        raise NotImplementedError
        
class RedisServerModelStorage(object):
    def __init__(self, redisconn):
        self.redisconn = redisconn
        
    def get(self, key):
        data = self.redisconn.get(key)
        if data is None:
            return None
        attrs = json.loads(data.decode('utf-8'))
        return attrs
    
    def set(self, key, val):
        self.redisconn.set(key, json.dumps(val))
        
    def create(self, key, val):
        with self.redisconn.pipeline() as pipe:
            pipe.watch(key)
            pipe.multi()
            if self.redisconn.exists(key):
                raise DataIntegrityException("%s already exists" % key)
            else:
                pipe.set(key, json.dumps(val))
            pipe.execute()
            

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

from flask import (request, session, abort, 
                   flash, redirect, url_for, render_template,
                   jsonify
                   )

class SingleUserAuthentication(AbstractAuthentication):
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
            return redirect(url_for('bokeh.server.register_get'))
        try:
            bokehuser = user.new_user(
                bokeh_app.servermodel_storage, username, password
                )
            self.login(username)
            self.print_connection_info(bokehuser)
        except UnauthorizedException:
            flash("user already exists")
            return redirect(url_for('bokeh.server.register_get'))
        return redirect("/bokeh")
    
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
            return redirect(url_for('bokeh.server.login_get'))
        return redirect("/bokeh")
        
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
            return redirect(url_for('bokeh.server.login_get'))
        return redirect("/bokeh")
    def logout(self):
        session.pop('username', None)
        return redirect("/")
