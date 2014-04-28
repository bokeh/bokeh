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
from ..session import PersistentBackboneSession, BaseJSONSession
from ..utils import encode_utf8, decode_utf8
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

class PersistentSession(PersistentBackboneSession, BaseJSONSession, StoreAdapter):
    """Base class for `RedisSession`, `InMemorySession`, etc. """

    def __init__(self, docid, doc=None):
        super(PersistentSession, self).__init__(plot=None)
        self.doc = doc
        self.docid = docid
        self.raw_js_objs = []

    @property
    def plotcontext(self):
        pc = super(PersistentSession, self).plotcontext
        if pc:
            return pc
        if not self.doc:
            self.doc = docs.Doc.load(bokeh_app.servermodel_storage, self.docid)
            self.plotcontext = self._models[self.doc.plot_context_ref['id']]
            return self.plotcontext

    @plotcontext.setter
    def plotcontext(self, val):
        self._plotcontext = val

    def dockey(self, docid):
        docid = encode_utf8('doc:' + docid)
        return docid

    def modelkey(self, typename, docid, modelid):
        docid = encode_utf8(docid)
        modelid = encode_utf8(modelid)
        return 'bbmodel:%s:%s:%s' % (typename, docid, modelid)

    def callbackskey(self, typename, docid, modelid):
        return 'bbcallback:%s:%s:%s' % (typename, docid, modelid)

    def parse_modelkey(self, key):
        _, typename, docid, modelid = decode_utf8(key).split(":")
        return typename, docid, modelid

    def set_doc(self, doc):
        self.doc = doc
        self.docid = doc.docid

    def prune(self, delete=False):
        all_models = docs.prune_and_get_valid_models(self, delete=delete)
        to_keep = set([x._id for x in all_models])
        to_delete = set(self._models.keys()) - to_keep
        for k in to_delete:
            del self._models[k]

    def load_all(self, asdict=False):
        doc_keys = self.smembers(self.dockey(self.docid))
        attrs = self.mget(doc_keys)
        if asdict:
            return attrs
        data = []
        for k, attr in zip(doc_keys, attrs):
            typename, _, modelid = self.parse_modelkey(k)
            attr = protocol.deserialize_json(decode_utf8(attr))
            data.append({'type': typename, 'attributes': attr})
        models = self.load_broadcast_attrs(data, events=None)
        for m in models:
            m._dirty = False
        return models

    def store_broadcast_attrs(self, attrs):
        if not attrs:
            return
        keys = [self.modelkey(attr['type'], self.docid, attr['attributes']['id']) for attr in attrs]
        for attr in attrs:
            attr['attributes']['doc'] = self.docid
        attrs = [self.serialize(attr['attributes']) for attr in attrs]
        dkey = self.dockey(self.docid)
        data = dict(zip(keys, attrs))
        self.mset(data)
        self.sadd(dkey, *keys)

    def del_objs(self, to_del):
        for m in to_del:
            mkey = self.modelkey(m.__view_model__, self.docid, m._id)
            self.srem(self.dockey(self.docid), mkey)
            self.delete(mkey)

    def load_all_callbacks(self, get_json=False):
        """get_json = return json of callbacks, rather than
        loading them into models
        """
        doc_keys = self.smembers(self.dockey(self.docid))
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

    # TODO: move this to appropriate superclass
    def raw_js_snippets(self, obj):
        self.raw_js_objs.append(obj)

class RedisSession(PersistentSession):
    """session used by the webserver to work with
    a user's documents.  uses redis directly.
    """

    def __init__(self, redis, docid, doc=None):
        self.redis = redis
        super(RedisSession, self).__init__(docid, doc)

    def mget(self, doc_keys):
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

class InMemorySession(PersistentSession):
    """session used by the webserver to work with
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

class ShelveSession(PersistentSession):
    """session used by the webserver to work with
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
            return list(_shelve_sets[doc_key])

    def set(self, key, data):
        with self.shelve_data() as _shelve_data:
            _shelve_data[key] = data

    def delete(self, key):
        with self.shelve_data() as _shelve_data:
            del _shelve_data[key]
