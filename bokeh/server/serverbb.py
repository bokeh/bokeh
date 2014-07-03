"""
In our python interface to the backbone system, we separate the local collection
which stores models, from the http client which interacts with a remote store
In applications, we would use a class that combines both
"""

import requests
import shelve
import uuid
import contextlib
import logging
from collections import defaultdict
from six.moves import cPickle as pickle
from .. import  protocol
from .models import docs
import numpy as np
logger = logging.getLogger(__name__)

from ..objects import PlotObject, Plot
from ..document import Document
from ..utils import encode_utf8, decode_utf8, dump
from . import server_backends
from .app import bokeh_app

class StoreAdapter(object):
    """API modeled after Redis that other stores have to adapt to. """

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

def dockey(docid):
    docid = encode_utf8('doc:' + docid)
    return docid

def modelkey(typename, docid, modelid):
    docid = encode_utf8(docid)
    modelid = encode_utf8(modelid)
    return 'bbmodel:%s:%s:%s' % (typename, docid, modelid)

def callbackskey(typename, docid, modelid):
    return 'bbcallback:%s:%s:%s' % (typename, docid, modelid)

def parse_modelkey(key):
    _, typename, docid, modelid = decode_utf8(key).split(":")
    return typename, docid, modelid
    
def prune(document, delete=False):
    all_models = docs.prune_and_get_valid_models(document, delete=delete)
    to_keep = set([x._id for x in all_models])
    to_delete = set(document._models.keys()) - to_keep
    for k in to_delete:
        document.remove(k)

class PersistentBackboneStorage(object):
    """Base class for `RedisBackboneStorage`, `InMemoryBackboneStorage`, etc. """

        
    def pull(self, docid, typename=None, objid=None):
        """you need to call this with either typename AND objid
        or leave out both.  leaving them out means retrieve all
        otherwise, retrieves a specific object
        """
        doc_keys = self.smembers(dockey(docid))
        attrs = self.mget(doc_keys)
        data = []
        for k, attr in zip(doc_keys, attrs):
            typename, _, modelid = parse_modelkey(k)
            attr = protocol.deserialize_json(decode_utf8(attr))
            data.append({'type': typename, 'attributes': attr})
        return data
        
    def get_document(self, docid):
        json_objs = self.pull(docid)
        doc = Document(json_objs)
        doc.docid = docid
        return doc
        
    def store_objects(self, docid, *objs, **kwargs):
        dirty_only = kwargs.pop('dirty_only', True)
        models = set()
        for obj in objs:
            models.add(obj.references())
        if dirty_only:
            models = list(models)            
        json_objs = utils.dump(models, docid)
        self.push(doc.docid, *json_objs)
        for mod in models:
            mod._dirty = False
        return models
        
    def store_document(self, doc, dirty_only=True):
        """store all dirty models
        """
        models = doc._models.values()
        if dirty_only:
            models = [x for x in models if hasattr(x, '_dirty') and x._dirty]
        json_objs = doc.dump(*models)
        self.push(doc.docid, *json_objs)
        for mod in models:
            mod._dirty = False
        return models
        
    def push(self, docid, *jsonobjs):
        keys = [modelkey(attr['type'], 
                              docid, 
                              attr['attributes']['id']) for attr in jsonobjs]
        for attr in jsonobjs:
            attr['attributes']['doc'] = docid
        attrs = [protocol.serialize_json(attr['attributes']) for attr in jsonobjs]
        dkey = dockey(docid)
        data = dict(zip(keys, attrs))
        self.mset(data)
        self.sadd(dkey, *keys)

    def del_obj(self, docid, m):
        mkey = modelkey(m.__view_model__, docid, m._id)
        self.srem(dockey(docid), mkey)
        self.delete(mkey)
    
    """unused for now """
    def load_all_callbacks(self, get_json=False):
        """get_json = return json of callbacks, rather than
        loading them into models
        """
        doc_keys = self.smembers(dockey(docid))
        callback_keys = [x.replace("bbmodel", "bbcallback") for x in doc_keys]
        callbacks = self.mget(callback_keys)
        callbacks = [x for x in callbacks if x]
        callbacks = [protocol.deserialize_json(x) for x in callbacks]
        if get_json:
            return callbacks
        self.load_callbacks_json(callbacks)

    def store_callbacks(self, to_store):
        for callbacks in to_store:
            typename = callbacks['type']
            _id = callbacks['id']
            key = self.callbackskey(typename, self.docid, _id)
            data = self.serialize(callbacks)
            self.set(key, data)

class RedisBackboneStorage(PersistentBackboneStorage):
    """storage used by the webserver to work with
    a user's documents.  uses redis directly.
    """
    def __init__(self, redis):
        self.redis = redis
        super(RedisBackboneStorage, self).__init__()

    def mget(self, doc_keys):
        if not doc_keys:
            return []
        vals = self.redis.mget(doc_keys)
        return [None if val is None else val.decode('utf-8') for val in vals]

    def mset(self, data):
        self.redis.mset(data)

    def sadd(self, doc_key, *keys):
        self.redis.sadd(doc_key, *keys)

    def srem(self, doc_key, mkey):
        self.redis.srem(doc_key, mkey)

    def smembers(self, doc_key):
        vals = self.redis.smembers(doc_key)
        return [None if val is None else val.decode('utf-8') for val in vals]

    def set(self, key, data):
        self.redis.set(key, data)

    def delete(self, mkey):
        self.redis.delete(mkey)

class InMemoryBackboneStorage(PersistentBackboneStorage):
    """storage used by the webserver to work with
    a user's documents.  uses in memory data store directly.
    """

    _inmem_data = {}
    _inmem_sets = defaultdict(set)

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

class ShelveBackboneStorage(PersistentBackboneStorage):
    """storage used by the webserver to work with
    a user's documents.  uses shelve data store directly.
    """

    @contextlib.contextmanager
    def shelve_data(self):
        data = shelve.open('bokeh.data')
        try:
            yield data
        finally:
            data.close()

    @contextlib.contextmanager
    def shelve_sets(self):
        sets = shelve.open('bokeh.sets')
        try:
            yield sets
        finally:
            sets.close()

    def mget(self, doc_keys):
        with self.shelve_data() as _shelve_data:
            return [_shelve_data.get(key, None) for key in doc_keys]

    def mset(self, data):
        with self.shelve_data() as _shelve_data:
            for k, v in data.items():
                _shelve_data[k] = v

    def sadd(self, doc_key, *keys):
        with self.shelve_sets() as _shelve_sets:
            shelve_set = _shelve_sets.get(doc_key, set())
            shelve_set.update(keys)
            _shelve_sets[doc_key] = shelve_set

    def srem(self, doc_key, member_key):
        with self.shelve_sets() as _shelve_sets:
            shelve_set = _shelve_sets[doc_key]
            try: shelve_set.remove(member_key)
            except KeyError: pass
            _shelve_sets[doc_key] = shelve_set

    def smembers(self, doc_key):
        with self.shelve_sets() as _shelve_sets:
            return list(_shelve_sets.get(doc_key, []))

    def set(self, key, data):
        with self.shelve_data() as _shelve_data:
            _shelve_data[key] = data

    def delete(self, key):
        with self.shelve_data() as _shelve_data:
            del _shelve_data[key]
