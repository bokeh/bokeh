from __future__ import absolute_import

from os.path import dirname, join
import uuid
import imp

import zmq

from ..settings import settings as bokeh_settings

default_blaze_config = join(dirname(__file__), 'blaze', 'config.py')

_defaults = dict(
    ip="0.0.0.0",
    port=5006,
    url_prefix="",
    multi_user=False,
    # make scripts for now - for now cli will only
    # pass one script
    scripts="",
    model_backend={'type' : 'shelve'},
    # model_backend={'type' : redis, 'redis_port' : 7001, 'start-redis' : True},
    # model_backend={'type' : memory},
    # model_backend={'type' : shelve},
    filter_logs=False,
    ws_conn_string=None,
    pub_zmqaddr="inproc://bokeh_in",
    sub_zmqaddr="inproc://bokeh_out",
    debug=False,
    dev=False,
    splitjs=False,
    robust_reload=False,
    verbose=False,
    run_forwarder=True,
    secret_key=str(uuid.uuid4()),
    blaze_config=default_blaze_config,
)

class Settings(object):
    _debugjs = False
    _ctx = None
    fields = _defaults.keys()

    def reset(self):
        for k,v in _defaults.items():
            setattr(self, k, v)

    @property
    def ctx(self):
        if self._ctx is None or self._ctx.closed:
            self._ctx = zmq.Context()
        return self._ctx

    @property
    def debugjs(self):
        return bokeh_settings.debugjs

    @debugjs.setter
    def debugjs(self, val):
        bokeh_settings.debugjs = val

    def from_file(self, filename=None):
        name = "_bokeh_server_configuration"
        mod = imp.load_source(name, filename)
        for k in self.fields:
            v = getattr(mod, k, None)
            if v is not None:
                setattr(self, k, v)
        self.process_settings()

    def from_dict(self, input_dict):
        for k,v in input_dict.items():
            setattr(self, k, v)

    def from_args(self, args):
        self.ip = args.ip
        self.port = args.port
        self.multi_user = args.multi_user
        self.model_backend = {'type' : args.backend}
        if self.model_backend['type'] == 'redis':
            self.model_backend.update({
                'redis_port' : args.redis_port,
                'start-redis' : args.start_redis
            })
        self.ws_conn_string = args.ws_conn_string
        self.debug = args.debug
        self.debugjs = args.debugjs
        self.splitjs = args.splitjs
        self.robust_reload = args.robust_reload
        self.verbose = args.verbose
        self.run_forwarder = True
        if args.blaze_config is not None:
            self.blaze_config = args.blaze_config
        if args.script:
            self.scripts = [args.script]

    def process_settings(self):
        if self.url_prefix:
            if not self.url_prefix.startswith("/"):
                self.url_prefix = "/" + self.url_prefix
            if self.url_prefix.endswith("/"):
                self.url_prefix = self.url_prefix[:-1]

settings = Settings()
settings.reset()
del Settings
