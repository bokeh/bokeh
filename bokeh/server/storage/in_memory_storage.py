''' Implement an in-memory storage backend for Bokeh Servers.

'''
from __future__ import absolute_import

from .abstract_storage import AbstractStorage

class InMemoryStorage(AbstractStorage):
    '''

    '''

    def __init__(self):
        self._inmem_data = {}
        self._inmem_sets = defaultdict(set)

    def mget(self, doc_keys):
        return [self._inmem_data.get(key, None) for key in doc_keys]

    def mset(self, data):
        self._inmem_data.update(data)

    def sadd(self, doc_key, *keys):
        self._inmem_sets[doc_key].update(keys)

    def srem(self, doc_key, member_key):
        inmem_set = self._inmem_sets[doc_key]
        try: inmem_set.remove(member_key)
        except KeyError: pass

    def smembers(self, doc_key):
        return list(self._inmem_sets[doc_key])

    def set(self, key, data):
        self._inmem_data[key] = data

    def delete(self, key):
        del self._inmem_data[key]
