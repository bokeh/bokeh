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

import json

from bokeh.exceptions import DataIntegrityException

from .abstract_model_storage import AbstractModelStorage
from .backbone_storage import BackboneStorage

class RedisModelStorage(AbstractModelStorage):
    """ Concrete server model storage using Redis for storage.

    """
    def __init__(self, redisconn):
        self.redisconn = redisconn

    def get(self, key):
        data = self.redisconn.get(key)
        if data is None:
            return None
        attrs = json.loads(data.decode('utf-8'))
        return attrs

    def set(self, key, val):
        self.redisconn.set(key, json.dumps(val))

    def create(self, key, val):
        with self.redisconn.pipeline() as pipe:
            pipe.watch(key)
            pipe.multi()
            if self.redisconn.exists(key):
                raise DataIntegrityException("%s already exists" % key)
            pipe.set(key, json.dumps(val))
            pipe.execute()

class RedisBackboneStorage(BackboneStorage):
    """ Concrete BackBone model storage using Redis for storage.

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