from bokeh import protocol
import requests
import urlparse
import uuid
import logging
import cPickle as pickle
import redis
from bokeh.bbmodel import make_model
import numpy as np
log = logging.getLogger(__name__)
"""
In our python interface to the backbone system, we separate the local collection
which stores models, from the http client which interacts with a remote store
In applications, we would use a class that combines both
"""
    
def dockey(docid):
    return 'doc:' + docid

def modelkey(typename, modelid):
    return 'bbmodel:%s:%s' % (typename, modelid)

def parse_modelkey(modelkey):
    _, typename, modelid = modelkey.split(":")
    return (typename, modelid)

class ContinuumModelsStorage(object):
    def __init__(self, client, ph=None):
        if ph is None:
            ph = protocol.ProtocolHelper()
        self.ph = ph
        self.client = client
        
    def bbget(self, client, key):
        typename, modelid = parse_modelkey(key)
        attrs = client.get(key)
        if attrs is None:
            return None

        else:
            attrs = self.ph.deserialize_web(attrs)
            return make_model(typename, **attrs)

    def bbset(self, client, key, model):
        return client.set(key, self.ph.serialize_web(model.attributes))
        
    def get_bulk(self, docid, typename=None):
        doc_keys = self.client.smembers(dockey(docid))
        result = []
        for k in doc_keys:
            m = self.bbget(self.client, k)
            if docid in m.get('docs') and \
               (typename is None or m.typename == typename):
                result.append(m)
        return result
    
    def get(self, typename, id):
        return self.bbget(self.client, modelkey(typename, id))
    
    def add(self, model, retries=10):
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
        mkey = modelkey(model.typename, model.id)
        pipe.watch(mkey)
        oldmodel = self.bbget(self.client, mkey)
        if oldmodel is None:
            olddocs = []
        else:
            olddocs = oldmodel.get('docs')
        pipe.multi()
        self.bbset(pipe, mkey, model)        
        docs_to_remove = set(olddocs).difference(model.get('docs'))        
        for doc in docs_to_remove:
            pipe.srem(dockey(doc), mkey)
        docs_to_add = set(model.get('docs')).difference(olddocs)
        for doc in docs_to_add:
            pipe.sadd(dockey(doc), mkey)
            
    def attrupdate(self, typename, attributes):
        id = attributes['id']
        mkey = modelkey(typename, id)        
        with self.client.pipeline() as pipe:
            pipe.watch(mkey)
            model = self.get(typename, id)
            for k,v in attributes.iteritems():
                model.set(k, v)
            self._upsert(pipe, model)
            pipe.execute()
        return model
    
    def delete(self, typename, id):
        mkey = modelkey(typename, id)
        oldmodel = self.bbget(self.client, mkey)
        olddocs = oldmodel.get('docs')
        for doc in olddocs:
            self.client.srem(dockey(doc), mkey)
        self.client.delete(mkey)
        
