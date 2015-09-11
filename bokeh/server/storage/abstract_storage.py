''' Define an abstract interface for Bokeh Server storage backends.

'''
from __future__ import absolute_import

class AbstractStorage(object):
    ''' Storage API modeled after Redis

    '''

    def mget(self, doc_keys):
        raise NotImplementedError("abstract method")

    def mset(self, data):
        raise NotImplementedError("abstract method")

    def sadd(self, doc_key, *keys):
        raise NotImplementedError("abstract method")

    def srem(self, doc_key, member_key):
        raise NotImplementedError("abstract method")

    def smembers(self, doc_key):
        raise NotImplementedError("abstract method")

    def set(self, key, data):
        raise NotImplementedError("abstract method")

    def delete(self, key):
        raise NotImplementedError("abstract method")