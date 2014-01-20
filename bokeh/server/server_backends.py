class AbstractBackboneStorage(object):
    def get_session(self, docid, doc=None):
        raise NotImplementedError
    
    
class RedisBackboneStorage(object):
    def __init__(self, redisconn):
        self.redisconn = redisconn

    def get_session(self, docid, doc=None):
        from serverbb import RedisSession
        return RedisSession(self.redisconn, docid, doc=doc)

                            
