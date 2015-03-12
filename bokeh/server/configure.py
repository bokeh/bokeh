from __future__ import absolute_import

import logging
from os.path import dirname
import imp
import sys

from six.moves.queue import Queue
from tornado.web import Application, FallbackHandler
from tornado.wsgi import WSGIContainer

from .settings import settings as server_settings
from . import websocket
##bokeh_app is badly named - it's really a blueprint
from .app import bokeh_app, app
from .models import convenience as mconv
from .models import docs
from .zmqpub import Publisher
from .zmqsub import Subscriber
from .forwarder import Forwarder
from .blaze import get_blueprint as get_mbs_blueprint

from .server_backends import (
    InMemoryServerModelStorage,
    MultiUserAuthentication, RedisServerModelStorage, ShelveServerModelStorage,
    SingleUserAuthentication,
)
from .serverbb import (
    InMemoryBackboneStorage, RedisBackboneStorage, ShelveBackboneStorage
)

REDIS_PORT = 6379

def configure_flask(config_argparse=None, config_file=None, config_dict=None):
    if config_argparse:
        server_settings.from_args(config_argparse)
    if config_dict:
        server_settings.from_dict(config_dict)
    if config_file:
        server_settings.from_file(config_file)
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
    bokeh_app.url_prefix = server_settings.url_prefix
    bokeh_app.publisher = Publisher(server_settings.ctx, server_settings.pub_zmqaddr, Queue())

    for script in server_settings.scripts:
        script_dir = dirname(script)
        if script_dir not in sys.path:
            print ("adding %s to python path" % script_dir)
            sys.path.append(script_dir)
        print ("importing %s" % script)
        imp.load_source("_bokeh_app", script)

    #todo - push some of this into bokeh_app.setup?
    bokeh_app.setup(
        backend,
        bbstorage,
        servermodel_storage,
        authentication,
    )
registered = False
def register_blueprint():
    global registered
    if registered:
        logging.warn(
            "register_blueprint has already been called, why is it being called again"
        )
        return
    blaze_blueprint = get_mbs_blueprint(config_file=server_settings.blaze_config)
    app.register_blueprint(bokeh_app, url_prefix=server_settings.url_prefix)
    if blaze_blueprint:
        app.register_blueprint(blaze_blueprint, url_prefix=server_settings.url_prefix)
    registered = True

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
        def auth(auth, docid):
            #HACKY
            if docid.startswith("temporary-"):
                return True
            doc = docs.Doc.load(bokeh_app.servermodel_storage, docid)
            status = mconv.can_read_doc_api(doc, auth)
            return status
        self.wsmanager.register_auth('bokehplot', auth)

        self.subscriber = Subscriber(server_settings.ctx,
                                     [server_settings.sub_zmqaddr],
                                     self.wsmanager)
        if server_settings.run_forwarder:
            self.forwarder = Forwarder(server_settings.ctx, server_settings.pub_zmqaddr, server_settings.sub_zmqaddr)
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
    flask_app.secret_key = server_settings.secret_key
    tornado_app = SimpleBokehTornadoApp(flask_app, debug=server_settings.debug)
    tornado_app.start_threads()
    return tornado_app


# Gunicorn startup would look like
# gunicorn bokeh.server.configure.make_tornado_app(config_file=filename) -k tornado
# untested - but should work
