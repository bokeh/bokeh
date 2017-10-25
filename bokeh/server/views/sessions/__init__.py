# -*- coding: UTF-8 -*-
# Copyright 2014 Cole Maclean
"""Tornado sessions, stored in Redis.
"""
import datetime
import uuid
import json
from functools import wraps

try:
    from collections import MutableMapping  # py2
except ImportError:
    from collections.abc import MutableMapping  # py3
try:
    import cPickle as pickle  # py2
except ImportError:
    import pickle  # py3

import redis
from tornado.web import RequestHandler
from tornado.options import options, define

if not hasattr(options, 'redis_host'):
    define("redis_host", default="localhost", help="Redis host")
if not hasattr(options, 'redis_port'):
    define("redis_port", default=6379, help="Redis port number")
if not hasattr(options, 'redis_session_db'):
    try:
        default_db = options.redis_db
    except AttributeError:
        default_db = 0
    define("redis_session_db", default=default_db, help="Redis sessions database")
if not hasattr(options, 'session_length'):
    define("session_length", default=14, help="Session length in days")

REQUEST_PREFIX = 'req_'


class Session(MutableMapping):
    """Simple session, stored in redis.
    sess_id = uuid.uuid4().hex
    s = Session(sess_id)
    s['foo'] = 'bar'
    s.save()

    s = Session.load(sess_id)
    s['foo']
    > 'bar'
    """
    store = redis.StrictRedis(host=options.redis_host,
                              port=options.redis_port, db=options.redis_session_db)
    length = options.session_length * 86400  # in seconds

    def __init__(self, id, *args, **kwargs):
        self._id = id
        self._data = dict(*args, **kwargs)
        self._loaded = False
        self._dirty = False
        self._pipe = self.store.pipeline()

    def store_request(self, request):
        if not request:
            return

        # can only store strings as value, so we split request here
        for key, value in request.arguments.items():
            self.__setitem__(REQUEST_PREFIX + key, value[0])

    @classmethod
    def load(cls, id, preload=False):
        """Load the given session id from redis. If there's nothing for the
        id given, returns an empty session.
        If preload is True, load and unpickle all data.

        returns Session object.
        """
        session = Session(id)
        if preload:
            session._load_data()

        return session

    def _load_data(self, key=None):
        if self._loaded:
            return
        if key is None:
            # load everything
            for key, val in self.store.hgetall(self.id).items():
                # hgetall returns bytes
                key = key.decode('utf-8')
                self._data[key] = pickle.loads(val)
            self._loaded = True
        elif key in self:
            print('LOAD KEY:' + key)
            val = self.store.hget(self.id, key)
            self._data[key] = pickle.loads(val)

    @property
    def id(self):
        """Prefix the session id for storage."""
        return 'session:{0}'.format(self._id) if self._id else None

    def clear(self):
        """Delete the session and all data."""
        self._data.clear()
        self._pipe = self.store.pipeline()
        self.store.delete(self.id)

    def touch(self, remote_ip=None):
        """Update the session expiry and set the last access time
        and IP (if provided).
        """
        if remote_ip is not None:
            self['last_ip_address'] = remote_ip
        self['last_access_time'] = '{0}'.format(datetime.datetime.now())
        self._pipe.expire(self.id, self.length)

    def save(self, force=False):
        """Execute piped session commands."""
        if self._dirty or force:
            self._pipe.execute()
        self._dirty = False

    def __getitem__(self, key):
        try:
            return self._data[key]
        except KeyError:
            self._load_data(key=key)
            return self._data[key]

    def __setitem__(self, key, value):
        self._dirty = True
        self._pipe.hset(self.id,
                        key,
                        pickle.dumps(value))
        self._data[key] = value

    def __delitem__(self, key):
        # We save immediately here to prevent
        # autoloading of the key on next access
        if key in self:
            self._pipe.hdel(self.id, key)
            self.save(force=True)
            if key in self._data:
                del self._data[key]
        else:
            raise KeyError(key)

    def __iter__(self):
        self._load_data()
        return iter(self._data)

    def __len__(self):
        self._load_data()
        return len(self._data)

    def __repr__(self):
        self._load_data()
        return "<{0}, {1}>".format(self.id, repr(self._data))

    def __contains__(self, key):
        if key in self._data:
            return True
        elif not self._loaded:
            return self.store.hexists(self.id, key)
        else:
            return False

    def to_json(self):
        self._load_data()
        return json.dumps(self, default=lambda o: o._data,
                          sort_keys=True, indent=4)

    def copy(self):
        self._load_data()
        return Session(self._id, **self._data.copy())


def setup_session(handler):
    """Setup a new session (or retrieve the existing one)"""
    session_id = handler.get_secure_cookie('session')

    if session_id is not None:
        session_id = session_id.decode('utf-8')
        handler.session = Session.load(session_id)

    else:
        new_id = uuid.uuid4().hex
        handler.session = Session(new_id)
        handler.set_secure_cookie('session', new_id)

    if hasattr(handler, 'request'):
        handler.session.store_request(handler.request)

    handler.session.touch(remote_ip=handler.request.remote_ip)


def save_session(handler):
    """Store the session to redis."""
    if hasattr(handler, 'session') and handler.session is not None:
        if hasattr(handler.session, 'save'):
            handler.session.save()


class TornadoSessionHandler(RequestHandler):
    """Handlers inheriting from this class get session access (self.session).
    """

    def prepare(self):
        setup_session(self)

    def on_finish(self, *args, **kwargs):
        save_session(self)

    def clear_session(self):
        self.session.clear()
        self.clear_cookie('session')


def session(method):
    """Decorator for handler methods. Loads the session prior to method
    execution and saves it after.
    """

    @wraps(method)
    def wrapper(self, *args, **kwargs):
        setup_session(self)
        result = method(self, *args, **kwargs)
        save_session(self)
        return result

    return wrapper

