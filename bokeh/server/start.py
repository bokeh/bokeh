from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

import atexit
import os
import re
import sys
import uuid

from flask import Flask
from six.moves.queue import Queue

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

from bokeh import plotting # imports custom objects for plugin
from bokeh import glyphs, objects, protocol # import objects so that we can resolve them
from bokeh.utils import scale_delta

# this just shuts up pyflakes
glyphs, objects, plotting, protocol

from . import services
from .app import bokeh_app
from .models import user

from wsgiref.simple_server import make_server

PORT = 5006
REDIS_PORT = 6379

app = Flask("bokeh.server")

## TODO: split out configuration into multiple sections

def configure_websocket(websocket_params):
    zmqaddr = websocket_params.get('zmqaddr')
    bokeh_app.publisher = Publisher(zmqaddr, Queue())
    bokeh_app.websocket_params = websocket_params

def prepare_app(backend, single_user_mode=True, data_directory=None):

    # must import views before running apps
    from .views import deps

    # this just shuts up pyflakes
    deps

    if backend['type'] == 'redis':
        import redis
        rhost = backend.get('redis_host', '127.0.0.1')
        rport = backend.get('redis_port', REDIS_PORT)
        bbstorage = RedisBackboneStorage(redis.Redis(host=rhost, port=rport, db=2))
        servermodel_storage = RedisServerModelStorage(redis.Redis(host=rhost, port=rport, db=3))

    elif backend['type'] == 'memory':
        bbstorage = InMemoryBackboneStorage()
        servermodel_storage = InMemoryServerModelStorage()

    elif backend['type'] == 'shelve':
        bbstorage = ShelveBackboneStorage()
        servermodel_storage = ShelveServerModelStorage()

    if single_user_mode:
        authentication = SingleUserAuthentication()
    else:
        authentication = MultiUserAuthentication()

    if data_directory:
        data_manager = HDF5DataBackend(data_directory)
    else:
        data_manager = FunctionBackend()

    bokeh_app.setup(
        backend,
        bbstorage,
        servermodel_storage,
        authentication,
        data_manager
    )

    # where should we be setting the secret key....?
    if not app.secret_key:
        app.secret_key = str(uuid.uuid4())

    return app

def register_blueprint(prefix=None):
    app.register_blueprint(bokeh_app, url_prefix=prefix)
    bokeh_app.url_prefix = prefix

def make_default_user(bokeh_app):
    bokehuser = user.new_user(bokeh_app.servermodel_storage, "defaultuser",
                              str(uuid.uuid4()), apikey='nokey', docs=[])

    return bokehuser

def doc_prepare():
    app = prepare_app(dict(type='memory'))
    register_blueprint()
    return app

http_server = None

def start_services():
    if bokeh_app.backend['type'] == 'redis' and \
       bokeh_app.backend.get('start_redis', True):
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

    bokeh_app.publisher.start()
    if not bokeh_app.websocket_params['no_ws_start']:
        bokeh_app.subscriber = websocket.make_app(bokeh_app.url_prefix,
                                                  [bokeh_app.publisher.zmqaddr],
                                                  bokeh_app.websocket_params['ws_port']
        )
        bokeh_app.subscriber.start(thread=True)
    atexit.register(stop_services)

def stop_services():
    print('stop services')
    bokeh_app.publisher.kill = True
    if hasattr(bokeh_app, 'redis_proc'):
        bokeh_app.redis_proc.close()
    if hasattr(bokeh_app, 'subscriber'):
        bokeh_app.subscriber.stop()
    bokeh_app.publisher.stop()

def start_app(host="127.0.0.1", port=PORT, verbose=False):
    global http_server
    Gzip(app)
    http_server = make_server(host, port, app)
    start_services()
    print("\nStarting Bokeh plot server on port %d..." % port)
    print("View http://%s:%d/bokeh to see plots\n" % (host, port))
    http_server.serve_forever()
    stop_services()

def stop():
    stop_services()
    if hasattr(http_server, 'shutdown'):
        print ('shutdown')
        http_server.server_close()
        http_server.shutdown()
    elif hasattr(http_server, 'stop'):
        http_server.stop()
