import protocol
import requests
import urlparse
import urllib
import utils
import uuid
import logging
import copy
import cPickle as pickle
import redis

import numpy as np
log = logging.getLogger(__name__)
special_types = {}

def load_special_types():
    import specialmodels.pandasmodel

def register_type(typename, cls):
    special_types[typename] = cls
    
def make_model(typename, **kwargs):
    if typename in special_types:
        return special_types[typename](typename, **kwargs)
    else:
        return ContinuumModel(typename, **kwargs)
    
class ContinuumModel(object):
    hidden_fields = ()
    defaults = {}
    def __init__(self, typename, **kwargs):
        if 'client'in kwargs:
            self.client = kwargs.pop('client')
        else:
            self.client = None
        attrs = copy.copy(self.defaults)
        attrs.update(kwargs)
        self.attributes = attrs
        self.typename = typename
        self.attributes.setdefault('id', str(uuid.uuid4()))
        self.id = self.get('id')
        
    def ref(self):
        return {
            'type' : self.typename,
            'id' : self.attributes['id']
            }
    def get(self, key, default=None):
        return self.attributes.get(key, default)
    
    def get_obj(self, field, client):
        ref = self.get(field)
        return client.get(ref['type'], ref['id'])
    
    def vget_obj(self, field, client):
        return [client.get(ref['type'], ref['id']) for ref in \
                self.attributes.get(field)]
    
    def set(self, *args):
        # if passed key, value, set those
        # if passed an object, replace our attrs with the new object
        # except for hidden fields, for hidden fields aren't always specified
        # so we default to leaving ours in place if they're not specified in args
        if len(args) == 2:
            key, val = args
            self.attributes[key] = val
        else:
            newattrs = args[0]
            for k in self.attributes:
                if k in self.hidden_fields and k not in newattrs:
                    newattrs[k] = self.attributes[k]
            self.attributes = newattrs
        
    def unset(self, key):
        del self.attributes[key]
           
    def to_broadcast_json(self, include_hidden=False):
        #more verbose json, which includes collection/type info necessary
        #for recon on the JS side.
        json = self.ref()
        json['attributes'] = self.to_json(include_hidden=include_hidden)
        return json
    
    def to_json(self, include_hidden=False):
        attrs = copy.copy(self.attributes)
        if include_hidden:
            return attrs
        for field in self.hidden_fields:
            if field in attrs:
                attrs.pop(field)
        return attrs                

    def __str__(self):
        return "Model:%s" % self.typename
    
    def __repr__(self):
        return self.__str__()
    
    def pull(self):
        if not self.client:
            print "can't fetch, not connected to the server"
            return
        newobj = self.client.fetch(typename=self.typename,
                                   id=self.id,
                                   include_hidden=True
                                   )
        self.set(newobj.attributes)
        
    def update(self):
        if not self.client:
            import pdb;pdb.set_trace()
            print "can't update, not connected to the server"
            return
        self.client.update(self)
        
class ContinuumModelsClient(object):
    def __init__(self, docid, baseurl, apikey, session=None):
        self.apikey = apikey
        self.baseurl = baseurl
        parsed = urlparse.urlsplit(baseurl)
        self.docid = docid
        if session is None:
            session = requests.session()
        session.headers.update({'content-type':'application/json'})
        session.headers.update({'BOKEH-API-KEY' : self.apikey})
        session.verify = False
        self.s = session 
        super(ContinuumModelsClient, self).__init__()
        self.buffer = []
        
    def buffer_sync(self):
        """bulk upsert of everything in self.buffer
        """
        data = protocol.serialize_web(
            [x.to_broadcast_json(include_hidden=True) for x in self.buffer])
        url = utils.urljoin(self.baseurl, self.docid + "/", 'bulkupsert')
        self.s.post(url, data=data)
        for m in self.buffer:
            m.set('created', True)
        self.buffer = []
        
    def upsert_all(self, models):
        for m in models:
            self.update(m, defer=True)
        self.buffer_sync()
        
    #backbone API calls
    def delete(self, typename, id):
        url = utils.urljoin(self.baseurl, self.docid +"/",
                            typename + "/", id + "/")
        self.s.delete(url)
        
        
    def create(self, model, defer=False):
        model.set('doc', self.docid)
        if defer:
            self.buffer.append(model)
        else:
            url = utils.urljoin(self.baseurl,
                                self.docid + "/",
                                model.typename +"/")
            log.debug("create %s", url)
            self.s.post(url, data=protocol.serialize_json(
                model.to_json(include_hidden=True)))
            model.set('created', True)
        return model

    def update(self, model, defer=False):
        model.set('doc', self.docid)        
        if defer:
            self.buffer.append(model)
        else:
            url = utils.urljoin(self.baseurl,
                                self.docid + "/",
                                model.typename + "/",
                                model.id +"/")
            log.debug("create %s", url)
            self.s.put(url, data=protocol.serialize_web(
                model.to_json(include_hidden=True)))
        return model
    
    def get(self, typename, id, include_hidden=False):
        return self.fetch(typename=typename, id=id,
                          include_hidden=include_hidden)
    
    def fetch(self, typename=None, id=None, include_hidden=False):
        query = urllib.urlencode({'include_hidden' : include_hidden})
        if typename is None:
            url = utils.urljoin(self.baseurl, self.docid +"/") + "?" + query
            data = self.s.get(url).content
            specs = protocol.deserialize_web(data)
            models =  [make_model(x['type'], client=self, **x['attributes'])\
                       for x in specs]
            return models
        elif typename is not None and id is None:
            url = utils.urljoin(self.baseurl, self.docid +"/", typename + "/")
            url += "?" + query
            attrs = protocol.deserialize_web(self.s.get(url).content)
            models = [make_model(typename, client=self, **x) for x in attrs]
            return models
        elif typename is not None and id is not None:
            url = utils.urljoin(self.baseurl, self.docid +"/",
                                typename + "/", id +"/")
            url += "?" + query            
            attr = protocol.deserialize_web(self.s.get(url).content)
            if attr is None:
                return None
            model = make_model(typename, client=self, **attr)
            return model
        
