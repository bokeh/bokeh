#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

class AbstractBackboneStorage(object):
    """ Abstract base class for Backbone model stores. Modeled after Redis
    API.

    """

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
