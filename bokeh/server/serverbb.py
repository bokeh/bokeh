"""
In our python interface to the backbone system, we separate the local collection
which stores models, from the http client which interacts with a remote store
In applications, we would use a class that combines both
"""

from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)

from collections import defaultdict
import contextlib
import shelve

from bokeh import protocol
from bokeh.document import Document
from bokeh.util.serialization import dump
from bokeh.util.string import decode_utf8, encode_utf8

from ..exceptions import AuthenticationException
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

def prune(document, temporary_docid=None, delete=False):
    if temporary_docid is not None:
        storage_id = temporary_docid
    else:
        storage_id = document.docid
    to_delete = document.prune()
    if delete:
        for obj in to_delete:
            bokeh_app.backbone_storage.del_obj(storage_id, obj)

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
        json_objs = dump(models, docid)
        self.push(docid, *json_objs)
        for mod in models:
            mod._dirty = False
        return models

    def store_document(self, doc, temporary_docid=None, dirty_only=True):
        """store all dirty models
        """
        # This is not so nice - we need to use doc with the original docid
        # when we create json objs, however use the temporary_docid
        # when we actually store the values
        # TODO: refactor this API in the future for better separation
        if temporary_docid is not None:
            storage_id = temporary_docid
        else:
            storage_id = doc.docid
        logger.debug("storing objects to %s", storage_id)
        models = doc._models.values()
        if dirty_only:
            models = [x for x in models if hasattr(x, '_dirty') and x._dirty]
        json_objs = doc.dump(*models)
        self.push(storage_id, *json_objs)
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

    # UNUSED FOR NOW
    # def load_all_callbacks(self, get_json=False):
    #     """get_json = return json of callbacks, rather than
    #     loading them into models
    #     """
    #     doc_keys = self.smembers(dockey(docid))
    #     callback_keys = [x.replace("bbmodel", "bbcallback") for x in doc_keys]
    #     callbacks = self.mget(callback_keys)
    #     callbacks = [x for x in callbacks if x]
    #     callbacks = [protocol.deserialize_json(x) for x in callbacks]
    #     if get_json:
    #         return callbacks
    #     self.load_callbacks_json(callbacks)

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

def get_temporary_docid(request, docid):
    key = 'temporary-%s' % docid
    return request.headers.get(key, None)


class BokehServerTransaction(object):
    #hugo - is this the right name?
    """Context Manager for a req/rep response cycle of the bokeh server
    responsible for
    -  determining whether the current user can read from a document
    -  determining whether the current user can write to a bokeh document
    (or temporary document for copy on write)
    -  stitching together documents to form a copy on write view
    -  saving changes to the document

    at the start of the context manager, self.clientdoc is populated
    with an instance of bokeh.document.Document with all the data
    loaded in (including from the copy on write context if specified)
    at the end of the context manager, changed models are written
    to the appropriate storage location.  and changed models are
    written to self.changed

    currently deletes aren't really working properly with cow - but we
    don't really make use of model deletions yet
    """
    def __init__(self, server_userobj, server_docobj, mode,
                 temporary_docid=None):
        """
        bokeh_app : bokeh_app blueprint
        server_userobj : instance of bokeh.server.models.user.User - current user
          for a request
        server_docobj : instance of bokeh.server.models.docs.Doc
        mode : 'r', or 'rw', or 'auto' - auto means rw if possible, else r
        temporary_docid : temporary docid for copy on write
        """
        logger.debug(
            "created transaction with %s, %s",
            server_docobj.docid, temporary_docid
        )
        self.server_userobj = server_userobj
        self.server_docobj = server_docobj
        self.temporary_docid = temporary_docid
        can_write = bokeh_app.authentication.can_write_doc(
            self.server_docobj,
            userobj=self.server_userobj,
            temporary_docid=self.temporary_docid)
        if can_write:
            can_read = True
        else:
            can_read = bokeh_app.authentication.can_read_doc(
                self.server_docobj,
                userobj=self.server_userobj)
        docid = self.server_docobj.docid
        if mode not in {'auto', 'rw', 'r'}:
            raise AuthenticationException('Unknown Mode')
        if mode == 'auto':
            if not can_write and not can_read:
                raise AuthenticationException("could not read from %s" % docid)
            if can_write:
                mode = 'rw'
            else:
                mode = 'r'
        else:
            if mode == 'rw':
                if not can_write:
                    raise AuthenticationException("could not write to %s" % docid)
            elif mode == 'r':
                if not can_read:
                    raise AuthenticationException("could not read from %s" % docid)
        self.mode = mode
        if self.mode == 'rw':
            self.apikey = self.server_docobj.apikey
        else:
            self.apikey = self.server_docobj.readonlyapikey
    @property
    def write_docid(self):
        if self.temporary_docid:
            return self.temporary_docid
        else:
            return self.server_docobj.docid

    def load(self, gc=False):
        from .views.backbone import init_bokeh
        clientdoc = bokeh_app.backbone_storage.get_document(self.server_docobj.docid)
        if self.temporary_docid:
            temporary_json = bokeh_app.backbone_storage.pull(self.temporary_docid)
            #no events - because we're loading from datastore, so nothing is new
            clientdoc.load(*temporary_json, events='none', dirty=False)
        if gc and self.mode != 'rw':
            raise AuthenticationException("cannot run garbage collection in read only mode")
        elif gc and self.mode == 'rw':
            prune(clientdoc, delete=True)
        else:
            prune(clientdoc)
        init_bokeh(clientdoc)
        self.clientdoc = clientdoc

    def save(self):
        if self.mode != 'rw':
            raise AuthenticationException("cannot save in read only mode")
        self.changed = bokeh_app.backbone_storage.store_document(
            self.clientdoc,
            temporary_docid=self.temporary_docid
        )
        logger.debug("stored %s models", len(self.changed))
