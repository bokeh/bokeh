from bokeh import protocol
import requests
import urlparse
import uuid
import logging
import cPickle as pickle
import redis
import bokeh.bbmodel as bbmodel
from bokeh.bbmodel import ContinuumModelsClient
import numpy as np
log = logging.getLogger(__name__)
"""
In our python interface to the backbone system, we separate the local collection
which stores models, from the http client which interacts with a remote store
In applications, we would use a class that combines both
"""
    
def dockey(docid):
    return 'doc:' + docid

def modelkey(typename, docid, modelid):
    return 'bbmodel:%s:%s:%s' % (typename, docid, modelid)

def parse_modelkey(modelkey):
    _, typename, docid, modelid = modelkey.split(":")
    return (typename, docid, modelid)

class ContinuumModelsStorage(object):
    def __init__(self, client, ph=None):
        if ph is None:
            ph = protocol.ProtocolHelper()
        self.ph = ph
        self.client = client
        
    def bbget(self, client, key):
        typename, docid, modelid = parse_modelkey(key)
        attrs = client.get(key)
        if attrs is None:
            return None

        else:
            attrs = self.ph.deserialize_web(attrs)
            return make_model(typename, **attrs)

    def bbset(self, client, key, model):
        return client.set(key, self.ph.serialize_web(
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
                                 key,
                                 app.ph)
    
def make_model(typename, **kwargs):
    """the server should use this make_model function,
    it automatically passes in a model client to all models
    too much magic? (@hugo)
    """
    from flask import g
    if 'client' not in kwargs and hasattr(g, 'client'):
        return bbmodel.make_model(typename, client=g.client, **kwargs)
    return bbmodel.make_model(typename, **kwargs)

    
        
