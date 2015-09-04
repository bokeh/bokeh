#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__name__)

from collections import defaultdict
import json

from bokeh.exceptions import DataIntegrityException
from bokeh.util.string import decode_utf8

from .abstract_model_storage import AbstractModelStorage
from .backbone_storage import BackboneStorage

class InMemoryModelStorage(AbstractModelStorage):
    """ Concrete server model storage using in-memory data structures for
    storage.

    .. warning::
        This storage backend is not persistent.

    """
    def __init__(self):
        self._data = {}

    def get(self, key):
        data = self._data.get(key, None)
        if data is None:
            return None
        attrs = json.loads(decode_utf8(data))
        return attrs

    def set(self, key, val):
        self._data[key] = json.dumps(val)

    def create(self, key, val):
        if key in self._data:
            raise DataIntegrityException("%s already exists" % key)
        self._data[key] = json.dumps(val)

class InMemoryBackboneStorage(BackboneStorage):
    """ Concrete BackBone  storage using in-memory data structures for
    storage.

    .. warning::
        This storage backend is not persistent.

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

