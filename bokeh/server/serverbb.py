import requests
import uuid
import logging
from six.moves import cPickle as pickle
import redis
from .. import  protocol
from .models import docs
import numpy as np
logger = logging.getLogger(__name__)

from ..objects import PlotObject, Plot
from ..session import PlotServerSession

"""
In our python interface to the backbone system, we separate the local collection
which stores models, from the http client which interacts with a remote store
In applications, we would use a class that combines both
"""

def dockey(docid):
    return 'doc:' + docid

def modelkey(typename, docid, modelid):
    return 'bbmodel:%s:%s:%s' % (typename, docid, modelid)

def callbackskey(typename, docid, modelid):
    return 'bbcallback:%s:%s:%s' % (typename, docid, modelid)

def parse_modelkey(modelkey):
    _, typename, docid, modelid = modelkey.split(":")
    return (typename, docid, modelid)

class RedisSession(PlotServerSession):
    """session used by the webserver to work with
    a user's documents.  uses redis directly.  This probably shouldn't
    inherit from PlotServerSession, we need to refactor this abit.
    """
    def __init__(self, redisconn, doc, root_url="http://localhost:5006/", apikey=""):
        super(RedisSession, self).__init__(serverloc=root_url)
        if isinstance(doc, basestring):
            self.docid = doc
        else:
            self.set_doc(doc)
        self.r = redisconn
        self._models = {}
        self.raw_js_objs = []
        self.root_url = root_url
        self.apikey = apikey

    def set_doc(self, doc):
        self.doc = doc
        self.docid = doc.docid

    def load(self):
        self.load_all()
        self.plotcontext = self._models[self.doc.plot_context_ref['id']]

    def prune(self, delete=False):
        all_models = docs.prune_and_get_valid_models(
            self.doc, self, delete=delete
            )
        to_keep = set([x._id for x in all_models])
        for k in self._models.keys():
            if k not in to_keep:
                del self._models[k]
        return

    def load_all(self, asdict=False):
        doc_keys = self.r.smembers(dockey(self.docid))
        attrs = self.r.mget(doc_keys)
        if asdict:
            return attrs
        data = []
        for k, attr in zip(doc_keys, attrs):
            typename, _, modelid = parse_modelkey(k)
            attr = protocol.deserialize_json(attr)
            data.append({'type' : typename,
                         'attributes' : attr})
        models = self.load_broadcast_attrs(data, events=None)
        for m in models:
            m._dirty = False
        return models

    def store_broadcast_attrs(self, attrs):
        keys = [modelkey(attr['type'], self.docid, attr['attributes']['id'])\
                for attr in attrs]
        for attr in attrs:
            attr['attributes']['doc'] = self.docid
        attrs = [self.serialize(attr['attributes']) for attr in attrs]
        dkey = dockey(self.docid)
        data = dict(zip(keys, attrs))
        logger.debug('storing %s', data)
        self.r.mset(data)
        self.r.sadd(dkey, *keys)

    def store_obj(self, obj):
        return self.store_objs([obj])

    def store_objs(self, to_store):
        if not to_store:
            return
        keys = [modelkey(m.__view_model__, self.docid, m._id) \
                for m in to_store]
        models = [m.vm_serialize() for m in to_store]
        for m in models:
            m['doc'] = self.docid
        models = [self.serialize(m) for m in models]
        dkey = dockey(self.docid)
        data = dict(zip(keys, models))
        for k,v in data.items():
            logger.debug('key: %s', k)
            logger.debug('val: %s', v)
        self.r.mset(data)
        self.r.sadd(dkey, *keys)

    def del_obj(self, obj):
        self.del_objs([obj])

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
