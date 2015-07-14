#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)

from bokeh import protocol
from bokeh.document import Document
from bokeh.util.serialization import dump
from bokeh.util.string import decode_utf8, encode_utf8

from .abstract_backbone_storage import AbstractBackboneStorage

class BackboneStorage(AbstractBackboneStorage):
    """

    """

    def pull(self, docid, typename=None, objid=None):
        """you need to call this with either typename AND objid
        or leave out both.  leaving them out means retrieve all
        otherwise, retrieves a specific object
        """
        doc_keys = self.smembers(_dockey(docid))
        attrs = self.mget(doc_keys)
        data = []
        for k, attr in zip(doc_keys, attrs):
            typename, _, modelid = _parse_modelkey(k)
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
        keys = [_modelkey(attr['type'],
                              docid,
                              attr['attributes']['id']) for attr in jsonobjs]
        for attr in jsonobjs:
            attr['attributes']['doc'] = docid
        attrs = [protocol.serialize_json(attr['attributes']) for attr in jsonobjs]
        dkey = _dockey(docid)
        data = dict(zip(keys, attrs))
        self.mset(data)
        self.sadd(dkey, *keys)

    def del_obj(self, docid, m):
        mkey = _modelkey(m.__view_model__, docid, m._id)
        self.srem(_dockey(docid), mkey)
        self.delete(mkey)

    # UNUSED FOR NOW
    # def load_all_callbacks(self, get_json=False):
    #     """get_json = return json of callbacks, rather than
    #     loading them into models
    #     """
    #     doc_keys = self.smembers(_dockey(docid))
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
            key = self._callbackskey(typename, self.docid, _id)
            data = self.serialize(callbacks)
            self.set(key, data)


def _dockey(docid):
    docid = encode_utf8('doc:' + docid)
    return docid

def _modelkey(typename, docid, modelid):
    docid = encode_utf8(docid)
    modelid = encode_utf8(modelid)
    return 'bbmodel:%s:%s:%s' % (typename, docid, modelid)

def _callbackskey(typename, docid, modelid):
    return 'bbcallback:%s:%s:%s' % (typename, docid, modelid)

def _parse_modelkey(key):
    _, typename, docid, modelid = decode_utf8(key).split(":")
    return typename, docid, modelid