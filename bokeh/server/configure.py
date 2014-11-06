import logging

from six.moves.queue import Queue
from tornado import ioloop
from tornado.web import Application, FallbackHandler
from tornado.wsgi import WSGIContainer

from .settings import settings as server_settings
from ..settings import settings as bokeh_settings
from . import websocket
##bokeh_app is badly named - it's really a blueprint
from .app import bokeh_app, app
from .models import user
from .zmqpub import Publisher
from .zmqsub import Subscriber
from .forwarder import Forwarder

from .server_backends import (
    FunctionBackend, HDF5DataBackend, InMemoryServerModelStorage,
    MultiUserAuthentication, RedisServerModelStorage, ShelveServerModelStorage,
    SingleUserAuthentication,
)
from .serverbb import (
    InMemoryBackboneStorage, RedisBackboneStorage, ShelveBackboneStorage
)

REDIS_PORT = 6379

def configure_flask(config_argparse=None, config_file=None):
    if config_argparse:
        server_settings.from_args(config_argparse)
    for handler in logging.getLogger().handlers:
        handler.addFilter(StaticFilter())
    # must import views before running apps
    from .views import deps
    # this just shuts up pyflakes
    deps
    backend = server_settings.model_backend
    if backend['type'] == 'redis':
        import redis
        rhost = backend.get('redis_host', '127.0.0.1')
        rport = backend.get('redis_port', REDIS_PORT)
        bbstorage = RedisBackboneStorage(redis.Redis(host=rhost, port=rport, db=2))
        servermodel_storage = RedisServerModelStorage(redis.Redis(host=rhost,
                                                                  port=rport, db=3))
    elif backend['type'] == 'memory':
        bbstorage = InMemoryBackboneStorage()
        servermodel_storage = InMemoryServerModelStorage()

    elif backend['type'] == 'shelve':
        bbstorage = ShelveBackboneStorage()
        servermodel_storage = ShelveServerModelStorage()

    if not server_settings.multi_user:
        authentication = SingleUserAuthentication()
    else:
        authentication = MultiUserAuthentication()

    if server_settings.data_directory:
        data_manager = HDF5DataBackend(server_settings.data_directory)
    else:
        data_manager = FunctionBackend()
    bokeh_app.url_prefix = server_settings.url_prefix
    bokeh_app.publisher = Publisher(server_settings.pub_zmqaddr, Queue())

    for script in server_settings.scripts:
        script_dir = dirname(args.script)
        if script_dir not in sys.path:
            print ("adding %s to python path" % script_dir)
            sys.path.append(script_dir)
        print ("importing %s" % args.script)
        imp.load_source("_bokeh_app", args.script)

    #todo - push some of this into bokeh_app.setup?
    bokeh_app.setup(
        backend,
        bbstorage,
        servermodel_storage,
        authentication,
        data_manager
    )

def register_blueprint():
    app.register_blueprint(bokeh_app, url_prefix=server_settings.url_prefix)

class SimpleBokehTornadoApp(Application):
    def __init__(self, flask_app, **settings):
        self.flask_app = flask_app
        tornado_flask = WSGIContainer(flask_app)
        url_prefix = server_settings.url_prefix
        handlers = [
            (url_prefix + "/bokeh/sub", websocket.WebSocketHandler),
            (r".*", FallbackHandler, dict(fallback=tornado_flask))
        ]
        super(SimpleBokehTornadoApp, self).__init__(handlers, **settings)
        self.wsmanager = websocket.WebSocketManager()
        self.subscriber = Subscriber([server_settings.sub_zmqaddr], self.wsmanager)
        if server_settings.run_forwarder:
            self.forwarder = Forwarder(server_settings.pub_zmqaddr,
                                       server_settings.sub_zmqaddr)
        else:
            self.forwarder = None

    def start_threads(self):
        bokeh_app.publisher.start()
        self.subscriber.start()
        if self.forwarder:
            self.forwarder.start()

    def stop_threads(self):
        bokeh_app.publisher.stop()
        self.subscriber.stop()
        if self.forwarder:
            self.forwarder.stop()

class StaticFilter(logging.Filter):
    def filter(self, record):
        msg = record.getMessage()
        return not (msg.startswith(("200 GET /static", "200 GET /bokehjs/static")))



def make_tornado_app(flask_app=None):
    if flask_app is None:
        flask_app = app
    if server_settings.debug:
        flask_app.debug = True
    tornado_app = SimpleBokehTornadoApp(flask_app, debug=server_settings.debug)
    tornado_app.start_threads()
    return tornado_app

"""
Gunicorn startup would look like
gunicorn bokeh.server.configure.make_tornado_app(config_file=filename) -k tornado
"""
