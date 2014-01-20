import json
import uuid
import models.user as user
from app import bokeh_app
from ..exceptions import DataIntegrityException

class AbstractBackboneStorage(object):
    def get_session(self, docid, doc=None):
        raise NotImplementedError
    
    
class RedisBackboneStorage(object):
    def __init__(self, redisconn):
        self.redisconn = redisconn

    def get_session(self, docid, doc=None):
        from serverbb import RedisSession
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
        attrs = json.loads(data)
        return attrs
    
    def set(self, key, val):
        self.redisconn.set(key, json.dumps(val))
        
    def create(self, key, val):
        with self.redisconn.pipeline() as pipe:
            pipe.watch(key)
            pipe.multi()
            if self.redisconn.exists(key):
                raise DataIntegrityException, "%s already exists" % key
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
        """custom login submission
        """
        raise NotImplementedError

    def register_get(self):
        """custom register view
        """
        raise NotImplementedError
    
    def register_post(self):
        """custom register submission
        """
        raise NotImplementedError
    
class SingleUserAuthentication(object):
    def current_user_name(self):
        return "defaultuser"
        
    def current_user(self):
        """returns bokeh User object from self.current_user_name
        """
        username = self.current_user_name()
        bokehuser = user.User.load(bokeh_app.servermodel_storage, username)
        if bokehuser is not None:
            return bokehuser
        docid = "defaultdoc"
        bokehuser = user.new_user(bokeh_app.servermodel_storage, "defaultuser",
                                  str(uuid.uuid4()), apikey='nokey', docs=[])
        return bokehuser


    
