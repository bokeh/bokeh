from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

import atexit
import os
import re
import sys
import uuid
import time
from flask import Flask
from six.moves.queue import Queue

from .settings import settings as server_settings
from ..settings import settings as bokeh_settings
from . import websocket
from .flask_gzip import Gzip
from .server_backends import (
    FunctionBackend, HDF5DataBackend, InMemoryServerModelStorage,
    MultiUserAuthentication, RedisServerModelStorage, ShelveServerModelStorage,
    SingleUserAuthentication,
)
from .serverbb import (
    InMemoryBackboneStorage, RedisBackboneStorage, ShelveBackboneStorage
)
from .zmqpub import Publisher
from .zmqsub import Subscriber
from .forwarder import Forwarder

from bokeh import plotting # imports custom objects for plugin
from bokeh import glyphs, objects, protocol # import objects so that we can resolve them
from bokeh.utils import scale_delta

# this just shuts up pyflakes
glyphs, objects, plotting, protocol

from . import services
from .app import bokeh_app, app
from .configure import configure_flask

from wsgiref.simple_server import make_server, WSGIServer, WSGIRequestHandler

def register_blueprint():
    app.register_blueprint(bokeh_app, url_prefix=server_settings.url_prefix)

def doc_prepare():
    server_settings.model_backend = {'type' : 'memory'}
    configure_flask()
    register_blueprint()
    return app

http_server = None
def start_redis():
    work_dir = getattr(bokeh_app, 'work_dir', os.getcwd())
    data_file = getattr(bokeh_app, 'data_file', 'redis.db')
    stdout = getattr(bokeh_app, 'stdout', sys.stdout)
    stderr = getattr(bokeh_app, 'stdout', sys.stderr)
    redis_save = getattr(bokeh_app, 'redis_save', True)
    mproc = services.start_redis(pidfilename=os.path.join(work_dir, "bokehpids.json"),
                                 port=bokeh_app.backend.get('redis_port', REDIS_PORT),
                                 data_dir=work_dir,
                                 data_file=data_file,
                                 stdout=stdout,
                                 stderr=stderr,
                                save=redis_save)
    bokeh_app.redis_proc = mproc

from tornado import ioloop
from tornado.web import Application, FallbackHandler
from tornado.wsgi import WSGIContainer
from tornado.httpserver import HTTPServer

tornado_flask = WSGIContainer(app)

class SimpleBokehApp(Application):
    def __init__(self, **settings):
        url_prefix = server_settings.url_prefix
        handlers = [
            (url_prefix + "/bokeh/sub", websocket.WebSocketHandler),
            (r".*", FallbackHandler, dict(fallback=tornado_flask))
        ]
        super(SimpleBokehApp, self).__init__(handlers, **settings)
        self.wsmanager = websocket.WebSocketManager()
        self.subscriber = Subscriber([server_settings.sub_zmqaddr], self.wsmanager)
        self.forwarder = Forwarder(server_settings.pub_zmqaddr,
                                   server_settings.sub_zmqaddr)

    def start_threads(self):
        bokeh_app.publisher.start()
        self.subscriber.start()
        self.forwarder.start()

    def stop_threads(self):
        bokeh_app.publisher.stop()
        self.subscriber.stop()
        self.forwarder.stop()

tornado_app = None
def start_simple_server():
    global tornado_app
    tornado_app = SimpleBokehApp()
    tornado_app.start_threads()
    server = HTTPServer(tornado_app)
    server.listen(server_settings.port, server_settings.ip)
    ioloop.IOLoop.instance().start()


# def stop_services():
#     print('stop services')
#     bokeh_app.publisher.kill = True
#     if hasattr(bokeh_app, 'redis_proc'):
#         bokeh_app.redis_proc.close()
#     if hasattr(bokeh_app, 'subscriber'):
#         bokeh_app.subscriber.stop()
#     bokeh_app.publisher.stop()

# def start_app(host="127.0.0.1", port=PORT, verbose=False):
#     global http_server
#     Gzip(app)
#     http_server = make_server(host, port, app,
#                               handler_class=BokehWSGIHandler)
#     start_services()
#     print("\nStarting Bokeh plot server on port %d..." % port)
#     print("View http://%s:%d/bokeh to see plots\n" % (host, port))
#     http_server.serve_forever()
#     stop_services()

def stop():
    if hasattr(bokeh_app, 'redis_proc'):
        bokeh_app.redis_proc.close()
    tornado_app.stop_threads()
