import requests
import urlparse
import uuid
import logging
import cPickle as pickle
import redis
import bokeh.bbmodel as bbmodel
from bokeh import protocol
from bokeh.bbmodel import ContinuumModelsClient
from models import docs
import numpy as np
logger = logging.getLogger(__name__)

from bokeh.objects import PlotObject, Plot
from bokeh.session import PlotServerSession

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

class ContinuumModelsStorage(object):
    def __init__(self, client):
        self.client = client
        
    def bbget(self, client, key):
        typename, docid, modelid = parse_modelkey(key)
        attrs = client.get(key)
        if attrs is None:
            return None

        else:
            attrs = protocol.deserialize_web(attrs)
            return make_model(typename, **attrs)

    def bbset(self, client, key, model):
        return client.set(key, protocol.serialize_web(
            model.to_json(include_hidden=True)))
        
    def get_bulk(self, docid, typename=None):
        doc_keys = self.client.smembers(dockey(docid))
        result = []
        for k in doc_keys:
            m = self.bbget(self.client, k)
            if typename is None or m.typename==typename:
                result.append(m)
        return result
    
    def add(self, model, retries=10):
        model.set('created', True)
        try:
            with self.client.pipeline() as pipe:
                self._upsert(pipe, model)
                pipe.execute()
        except redis.WatchError as e:
            if retries > 0:
                self.add(model, retries=retries-1)
            else:
                raise
            
    def _upsert(self, pipe, model):
        # I don't think the document level locking I wrote here
        # is necessary
        mkey = modelkey(model.typename, model.get('doc'), model.id)
        pipe.watch(mkey)
        pipe.multi()
        pipe.sadd(dockey(model.get('doc')), mkey)
        self.bbset(pipe, mkey, model)
            
    def attrupdate(self, typename, docid, attributes):
        id = attributes['id']
        mkey = modelkey(typename, docid, id)
        with self.client.pipeline() as pipe:
            pipe.watch(mkey)
            model = self.get(typename, docid, id)
            for k,v in attributes.iteritems():
                model.set(k, v)
            self._upsert(pipe, model)
            pipe.execute()
        return model

    #backbone api functions
    def get(self, typename, docid, id):
        return self.bbget(self.client, modelkey(typename, docid, id))
    
    def delete(self, typename, docid, id):
        mkey = modelkey(typename, docid, id)
        oldmodel = self.bbget(self.client, mkey)
        self.client.srem(dockey(docid), mkey)
        self.client.delete(mkey)
        
    def create(self, model):
        self.add(model)
        
    def update(self, model):
        self.add(model)

    def fetch(self, docid, typename=None, id=None):
        if id is None:
            return self.get_bulk(self, docid, typename=None)
        else:
            return self.get(typename, docid, id)



def client_for_request(doc, app, request, mode):
    if mode =='r':
        key = doc.readonlyapikey
    else:
        key = doc.apikey
    return ContinuumModelsClient(doc.docid,
                                 request.url_root + "bokeh/bb/",
                                 key)
    
def make_model(typename, **kwargs):
    """the server should use this make_model function,
    it automatically passes in a model client to all models
    too much magic? (@hugo)
    """
    from flask import g
    if 'client' not in kwargs and hasattr(g, 'client'):
        return bbmodel.make_model(typename, client=g.client, **kwargs)
    return bbmodel.make_model(typename, **kwargs)

class RedisSession(PlotServerSession):
    """session used by the webserver to work with
    a user's documents.  uses redis directly.  This probably shouldn't
    inherit from PlotServerSession, we need to refactor this abit.
    """
    def __init__(self, redisconn, doc, 
                 root_url="http://localhost:5006/", apikey=""):
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
        for k,v in data.iteritems():
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
