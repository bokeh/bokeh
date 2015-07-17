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

import contextlib
import json
import shelve

from bokeh.exceptions import DataIntegrityException
from bokeh.util.string import encode_utf8, decode_utf8

from .abstract_model_storage import AbstractModelStorage
from .backbone_storage import BackboneStorage

class ShelveModelStorage(AbstractModelStorage):
    """ Concrete server model storage using Python stdlib "shelve" for
    storage.

    """
    def get(self, key):
        _data = shelve.open('bokeh.server')
        key = encode_utf8(key)
        data = _data.get(key, None)
        if data is None:
            return None
        attrs = json.loads(decode_utf8(data))
        _data.close()
        return attrs

    def set(self, key, val):
        _data = shelve.open('bokeh.server')
        key = encode_utf8(key)
        _data[key] = json.dumps(val)
        _data.close()

    def create(self, key, val):
        key = str(key)
        _data = shelve.open('bokeh.server')
        if key in _data:
            raise DataIntegrityException("%s already exists" % key)
        _data[key] = json.dumps(val)
        _data.close()

class ShelveBackboneStorage(BackboneStorage):
    """ Concrete server model storage using Python stdlib "shelve" for
    storage.

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