#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import uuid

from bokeh.util.paths import bokehjsdir

_prefix = "BOKEH_SERVER_"

def optional(key, default=None, prefix=_prefix):
    from os import environ
    return environ.get(prefix+key, default)

def boolean(key, default=None):
    value = optional(key, default)

    if value.lower() in ["true", "yes", "on", "1"]:
        value = True
    elif value.lower() in ["false", "no", "off", "0"]:
        value = False
    else:
        raise ValueError("invalid value %r for boolean property" % (value, _prefix, key))

    return value

def integer(key, default=None):
    value = optional(key, default)

    try:
        return int(value)
    except ValueError:
        raise ValueError("invalid value %r for integer property %s%s" % (value, _prefix, key))

def log_level(key, default):
    value = optional(key, default)

    try:
        import logging
        LEVELS = {
            'debug': logging.DEBUG,
            'info' : logging.INFO,
            'warn' : logging.WARNING,
            'error': logging.ERROR,
            'fatal': logging.CRITICAL,
            'none' : None
        }
        return LEVELS[value]
    except KeyError:
        raise ValueError("invalid value %r for log level property %s%s" % (value, _prefix, key))

class Settings(object):

    IP = optional("IP", "0.0.0.0")
    PORT = integer("PORT", "5006")
    URL_PREFIX = optional("URL_PREFIX", "")

    STORAGE_BACKEND = "redis"
    REDIS_PORT = integer("REDIS_PORT", "7001")
    REDIS_HOST = optional("REDIS_HOST", "127.0.0.1")

    BOKEHJS_DIR = optional("BOKEHJS_DIR", bokehjsdir(optional("DEV", "no")))

    MULTI_USER = boolean("MULTI_USER", "no")

    HTTPS = boolean("HTTPS", "no")
    CERTFILE = optional("CERTFILE")
    KEYFILE = optional("KEYFILE")

    DEBUG = boolean("DEBUG", "no")
    LOG_LEVEL = log_level("LOG_LEVEL", "none")
    FILTER_LOGS = boolean("FILTER_LOGS", "no")

    PUB_ZMQADDR = optional("PUB_ZMQADDR", "inproc://bokeh_in")
    SUB_ZMQADDR = optional("SUB_ZMQADDR", "inproc://bokeh_out")

    WS_CONN_STRING = optional("WS_CONN_STRING")
    RUN_FORWARDER = boolean("RUN_FORWARDER", "yes")

    SECRET_KEY = optional("SECRET_KEY", str(uuid.uuid4()))

# clean up
#del _prefix, optional, integer, boolean, log_level, uuid