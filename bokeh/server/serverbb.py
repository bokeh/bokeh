"""
In our python interface to the backbone system, we separate the local collection
which stores models, from the http client which interacts with a remote store
In applications, we would use a class that combines both
"""

import requests
import shelve
import uuid
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

def dockey(docid):
    docid = encode_utf8('doc:' + docid)
    return docid

def modelkey(typename, docid, modelid):
    docid = encode_utf8(docid)
    modelid = encode_utf8(modelid)
    return 'bbmodel:%s:%s:%s' % (typename, docid, modelid)

def callbackskey(typename, docid, modelid):
    return 'bbcallback:%s:%s:%s' % (typename, docid, modelid)

def parse_modelkey(modelkey):
    _, typename, docid, modelid = decode_utf8(modelkey).split(":")
    return (typename, docid, modelid)

def parse_modelkey_redis(modelkey):
    _, typename, docid, modelid = modelkey.decode('utf-8').split(":")
    return (typename, docid, modelid)

class PersistentSession(PersistentBackboneSession, BaseJSONSession):
    """Base class for `RedisSession`, `InMemorySession`, etc. """

    def raw_js_snippets(self, obj):
        self.raw_js_objs.append(obj)

class RedisSession(PersistentSession):
    """session used by the webserver to work with
    a user's documents.  uses redis directly.
    """
    @property
    def plotcontext(self):
        pc = super(RedisSession, self).plotcontext
        if pc:  return pc
        if not self.doc:
            self.doc = docs.Doc.load(bokeh_app.servermodel_storage, self.docid)
            self.plotcontext = self._models[self.doc.plot_context_ref['id']]
            return self.plotcontext
    @plotcontext.setter
    def plotcontext(self, val):
        self._plotcontext = val

    def __init__(self, redisconn, docid, doc=None):
        super(RedisSession, self).__init__(plot=None)
        self.doc = doc
        self.docid = docid
        self.r = redisconn
        self.raw_js_objs = []

    def set_doc(self, doc):
        self.doc = doc
        self.docid = doc.docid

    def prune(self, delete=False):
        all_models = docs.prune_and_get_valid_models(
            self, delete=delete
            )
        to_keep = set([x._id for x in all_models])
        to_delete = set(self._models.keys()) - to_keep
        for k in to_delete:
            del self._models[k]
        return

    def load_all(self, asdict=False):
        doc_keys = self.r.smembers(dockey(self.docid))
        attrs = self.r.mget(doc_keys)
        if asdict:
            return attrs
        data = []
        for k, attr in zip(doc_keys, attrs):
            typename, _, modelid = parse_modelkey_redis(k)
            attr = protocol.deserialize_json(attr.decode('utf-8'))
            data.append({'type' : typename,
                         'attributes' : attr})
        models = self.load_broadcast_attrs(data, events=None)
        for m in models:
            m._dirty = False
        return models

    def store_broadcast_attrs(self, attrs):
        if not attrs:
            return
        keys = [modelkey(attr['type'], self.docid, attr['attributes']['id'])\
                for attr in attrs]
        for attr in attrs:
            attr['attributes']['doc'] = self.docid
        attrs = [self.serialize(attr['attributes']) for attr in attrs]
        dkey = dockey(self.docid)
        data = dict(zip(keys, attrs))
        #logger.debug('storing %s', data)
        self.r.mset(data)
        self.r.sadd(dkey, *keys)

    def del_objs(self, to_del):
        for m in to_del:
            mkey = modelkey(m.__view_model__, self.docid, m._id)
            self.r.srem(dockey(self.docid), mkey)
            self.r.delete(mkey)

    def load_all_callbacks(self, get_json=False):
        """get_json = return json of callbacks, rather than
        loading them into models
        """
        doc_keys = self.r.smembers(dockey(self.docid))
        callback_keys = [x.replace("bbmodel", "bbcallback") for x in doc_keys]
        callbacks = self.r.mget(callback_keys)
        callbacks = [x for x in callbacks if x]
        callbacks = [protocol.deserialize_json(x) for x in callbacks]
        if get_json:
            return callbacks
        self.load_callbacks_json(callbacks)

    def store_callbacks(self, to_store):
        for callbacks in to_store:
            typename = callbacks['type']
            _id = callbacks['id']
            key = callbackskey(typename, self.docid, _id)
            data = self.serialize(callbacks)
            self.r.set(key, data)


_inmem_data = {}
_inmem_sets = defaultdict(set)

class InMemorySession(PersistentSession):
    """session used by the webserver to work with
    a user's documents.  uses in memory data store directly.
    """
    @property
    def plotcontext(self):
        pc = super(InMemorySession, self).plotcontext
        if pc:  return pc
        if not self.doc:
            self.doc = docs.Doc.load(bokeh_app.servermodel_storage, self.docid)
            self.plotcontext = self._models[self.doc.plot_context_ref['id']]
            return self.plotcontext
    @plotcontext.setter
    def plotcontext(self, val):
        self._plotcontext = val

    def __init__(self, docid, doc=None):
        super(InMemorySession, self).__init__(plot=None)
        self.doc = doc
        self.docid = docid
        self.raw_js_objs = []

    def set_doc(self, doc):
        self.doc = doc
        self.docid = doc.docid

    def prune(self, delete=False):
        all_models = docs.prune_and_get_valid_models(
            self, delete=delete
            )
        to_keep = set([x._id for x in all_models])
        for k in self._models.keys():
            if k not in to_keep:
                del self._models[k]
        return

    def load_all(self, asdict=False):
        doc_keys = list(_inmem_sets[dockey(self.docid)])
        attrs = [_inmem_data[key] for key in doc_keys]
        if asdict:
            return attrs
        data = []
        for k, attr in zip(doc_keys, attrs):
            typename, _, modelid = parse_modelkey(k)
            attr = protocol.deserialize_json(decode_utf8(attr))
            data.append({'type' : typename,
                         'attributes' : attr})
        models = self.load_broadcast_attrs(data, events=None)
        for m in models:
            m._dirty = False
        return models

    def store_broadcast_attrs(self, attrs):
        if not attrs:
            return
        keys = [modelkey(attr['type'], self.docid, attr['attributes']['id'])\
                for attr in attrs]
        for attr in attrs:
            attr['attributes']['doc'] = self.docid
        attrs = [self.serialize(attr['attributes']) for attr in attrs]
        dkey = dockey(self.docid)
        data = dict(zip(keys, attrs))
        #logger.debug('storing %s', data)
        _inmem_data.update(data)
        _inmem_sets[dkey].update(keys)

    def del_objs(self, to_del):
        for m in to_del:
            mkey = modelkey(m.__view_model__, self.docid, m._id)
            _inmem_sets[dockey(self.docid)].remove(mkey)
            del _inmem_data[mkey]

    def load_all_callbacks(self, get_json=False):
        """get_json = return json of callbacks, rather than
        loading them into models
        """
        doc_keys = list(_inmem_sets[dockey(self.docid)])
        callback_keys = [x.replace("bbmodel", "bbcallback") for x in doc_keys]
        callbacks = [_inmem_data[key] for key in callback_keys]
        callbacks = [x for x in callbacks if x]
        callbacks = [protocol.deserialize_json(x) for x in callbacks]
        if get_json:
            return callbacks
        self.load_callbacks_json(callbacks)

    def store_callbacks(self, to_store):
        for callbacks in to_store:
            typename = callbacks['type']
            _id = callbacks['id']
            key = callbackskey(typename, self.docid, _id)
            data = self.serialize(callbacks)
            _inmem_data[key] = data

class ShelveSession(PersistentSession):
    """session used by the webserver to work with
    a user's documents.  uses shelve data store directly.
    """
    @property
    def plotcontext(self):
        pc = super(ShelveSession, self).plotcontext
        if pc:  return pc
        if not self.doc:
            self.doc = docs.Doc.load(bokeh_app.servermodel_storage, self.docid)
            self.plotcontext = self._models[self.doc.plot_context_ref['id']]
            return self.plotcontext
    @plotcontext.setter
    def plotcontext(self, val):
        self._plotcontext = val

    def __init__(self, docid, doc=None):
        super(ShelveSession, self).__init__(plot=None)
        self.doc = doc
        self.docid = docid
        self.raw_js_objs = []

    def set_doc(self, doc):
        self.doc = doc
        self.docid = doc.docid

    def prune(self, delete=False):
        all_models = docs.prune_and_get_valid_models(
            self, delete=delete
            )
        to_keep = set([x._id for x in all_models])
        to_delete = set(self._models.keys()) - to_keep
        for k in to_delete:
            del self._models[k]
        return

    def load_all(self, asdict=False):
        data = shelve.open('bokeh.data')
        sets = shelve.open('bokeh.sets')
        doc_keys = list(sets[dockey(self.docid)])
        attrs = [data[key] for key in doc_keys]
        if asdict:
            return attrs
        data = []
        for k, attr in zip(doc_keys, attrs):
            typename, _, modelid = parse_modelkey(k)
            attr = protocol.deserialize_json(decode_utf8(attr))
            data.append({'type' : typename,
                         'attributes' : attr})
        models = self.load_broadcast_attrs(data, events=None)
        for m in models:
            m._dirty = False
        return models
        data.close()
        sets.close()

    def store_broadcast_attrs(self, attrs):
        data = shelve.open('bokeh.data')
        sets = shelve.open('bokeh.sets')
        if not attrs:
            return
        keys = [modelkey(attr['type'], self.docid, attr['attributes']['id'])\
                for attr in attrs]
        for attr in attrs:
            attr['attributes']['doc'] = self.docid
        attrs = [self.serialize(attr['attributes']) for attr in attrs]
        dkey = dockey(self.docid)
        newdata = dict(zip(keys, attrs))
        #logger.debug('storing %s', data)
        for k, v in newdata.items():
            data[k] = v
        #if not sets.has_key(dkey):
        if not dkey in sets:
            temp = set()
        else:
            temp = sets[dkey]
        temp.update(keys)
        sets[dkey] = temp
        data.close()
        sets.close()

    def del_objs(self, to_del):
        data = shelve.open('bokeh.data')
        sets = shelve.open('bokeh.sets')
        for m in to_del:
            mkey = modelkey(m.__view_model__, self.docid, m._id)
            dkey = dockey(self.docid)
            temp = sets[dkey]
            temp.remove(mkey)
            sets[dkey] = temp
            del data[mkey]
        data.close()
        sets.close()

    def load_all_callbacks(self, get_json=False):
        """get_json = return json of callbacks, rather than
        loading them into models
        """
        data = shelve.open('bokeh.data')
        sets = shelve.open('bokeh.sets')
        doc_keys = list(sets[dockey(self.docid)])
        callback_keys = [x.replace("bbmodel", "bbcallback") for x in doc_keys]
        callbacks = [data[key] for key in callback_keys]
        callbacks = [x for x in callbacks if x]
        callbacks = [protocol.deserialize_json(x) for x in callbacks]
        if get_json:
            return callbacks
        self.load_callbacks_json(callbacks)
        data.close()
        sets.close()

    def store_callbacks(self, to_store):
        data = shelve.open('bokeh.data')
        sets = shelve.open('bokeh.sets')
        for callbacks in to_store:
            typename = callbacks['type']
            _id = callbacks['id']
            key = callbackskey(typename, self.docid, _id)
            data = self.serialize(callbacks)
            data[key] = data
        data.close()
        sets.close()

