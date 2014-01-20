import json

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

