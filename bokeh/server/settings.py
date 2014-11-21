import logging
from ..settings import settings as bokeh_settings
import uuid

class Settings(object):
    ip = "0.0.0.0"
    port = 5006
    url_prefix = ""
    data_directory = None
    multi_user = False
    # make scripts for now - for now cli will only
    # pass one script
    scripts = []
    model_backend = {'type' : 'shelve'}
    # model_backend = {'type' : redis, 'redis_port' : 7001, 'start-redis' : True}
    # model_backend = {'type' : memory}
    # model_backend = {'type' : shelve}
    filter_logs = False
    ws_conn_string = None
    pub_zmqaddr = "inproc://bokeh_in"
    sub_zmqaddr = "inproc://bokeh_out"
    debug = False
    dev = False
    splitjs = False
    robust_reload = False
    verbose = False
    run_forwarder = True
    secret_key = str(uuid.uuid4())
    _debugjs = False

    @property
    def debugjs(self):
        return bokeh_settings.debugjs

    @debugjs.setter
    def debugjs(self, val):
        bokeh_settings.debugjs = val

    def from_file(self, filename):
        raise NotImplementedError

    def from_dict(self, input_dict):
        for k,v in input_dict.items():
            setattr(self, k, v)

    def from_args(self, args):
        self.ip = args.ip
        self.port = args.port
        self.data_directory = args.data_directory
        self.multi_user = args.multi_user
        self.model_backend = {'type' : args.backend}
        if self.model_backend['type'] == 'redis':
            self.model_backend.update({
                'redis_port' : args.redis_port,
                'start-redis' : args.start_redis
            })
        self.ws_conn_string = args.ws_conn_string
        self.ws_port = args.ws_port
        self.debug = args.debug
        self.dev = args.dev
        self.splitjs = args.splitjs
        self.robust_reload = args.robust_reload
        self.verbose = args.verbose
        self.run_forwarder = True
        if args.script:
            self.scripts = [args.script]
    def process_settings(self, bokeh_app):
        if self.url_prefix:
            if not self.url_prefix.startswith("/"):
                self.url_prefix = "/" + self.url_prefix
            if self.url_prefix.endswith("/"):
                self.url_prefix = self.url_prefix[:-1]

settings = Settings()
del Settings
