from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

try:
    from geventwebsocket.handler import WebSocketHandler
    from gevent.pywsgi import WSGIServer
    def make_server(host, port, app):
        http_server = WSGIServer((host, port), app, handler_class=WebSocketHandler)
        return http_server
except ImportError:
    log.info("no gevent - your websockets won't work")
    from wsgiref.simple_server import make_server

import atexit
import os
import sys
import uuid
from flask import Flask

# import objects so that we can resolve them
from .. import protocol, objects, glyphs

from .app import bokeh_app
from .models import user
from . import services
from .server_backends import (
    RedisBackboneStorage, RedisServerModelStorage,
    InMemoryBackboneStorage, InMemoryServerModelStorage,
    ShelveBackboneStorage, ShelveServerModelStorage,
    SingleUserAuthentication, MultiUserAuthentication
)

PORT = 5006
REDIS_PORT = 6379

app = Flask("bokeh.server")

def prepare_app(backend, single_user_mode=True):
    # must import views before running apps
    from .views import deps

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

    bokeh_app.setup(backend, bbstorage, servermodel_storage, authentication)

    app.register_blueprint(bokeh_app)

    # where should we be setting the secret key....?
    if not app.secret_key:
        app.secret_key = str(uuid.uuid4())

def make_default_user(bokeh_app):
    bokehuser = user.new_user(bokeh_app.servermodel_storage, "defaultuser",
                              str(uuid.uuid4()), apikey='nokey', docs=[])

    return bokehuser

http_server = None

def start_services():
    if bokeh_app.backend['type'] == 'redis' and bokeh_app.backend.get('start_redis', True):
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
    atexit.register(stop_services)

def stop_services():
    if hasattr(bokeh_app, 'redis_proc'):
        bokeh_app.redis_proc.close()

def start_app(host="127.0.0.1", port=PORT, verbose=False):
    global http_server
    http_server = make_server(host, port, app)
    start_services()
    print("\nStarting Bokeh plot server on port %d..." % port)
    print("View http://%s:%d/bokeh to see plots\n" % (host, port))
    http_server.serve_forever()
