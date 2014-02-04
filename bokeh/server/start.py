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

from flask import request, Flask
import uuid
import socket

#server imports
from .app import bokeh_app
from . import wsmanager
#import objects so that we can resolve them
from .. import protocol, objects, glyphs
from .models import user, docs
from .models import convenience as mconv
import os
from os.path import join, dirname

import time
import sys
from .server_backends import (RedisBackboneStorage,
                              RedisServerModelStorage,
                              SingleUserAuthentication,
                              MultiUserAuthentication
                              )

PORT = 5006
REDIS_PORT = 6379


app = Flask("bokeh.server")

def prepare_app(rhost='127.0.0.1', rport=REDIS_PORT, start_redis=True,
                single_user_mode=True
                ):
    #must import views before running apps
    import redis

    from .views import deps
    bbstorage = RedisBackboneStorage(
        redis.Redis(host=rhost, port=rport, db=2)
        )
    #for non-backbone models
    servermodel_storage = RedisServerModelStorage(
        redis.Redis(host=rhost, port=rport, db=3)
        )
    if single_user_mode:
        authentication = SingleUserAuthentication()
    else:
        authentication = MultiUserAuthentication()
    bokeh_app.setup(rport, start_redis, bbstorage, servermodel_storage,
                    authentication
                    )

    app.register_blueprint(bokeh_app)

    #where should we be setting the secret key....?
    if not app.secret_key:
        app.secret_key = str(uuid.uuid4())
    #bokeh_app.pubsub_redis = redis.Redis(host=rhost, port=rport, db=4)

def make_default_user(bokeh_app):
    docid = "defaultdoc"
    bokehuser = user.new_user(bokeh_app.servermodel_storage, "defaultuser",
                              str(uuid.uuid4()), apikey='nokey', docs=[])

    return bokehuser


http_server = None

from . import services
import os
import atexit
def start_services():
    if bokeh_app.start_redis:
        #for tests:
        data_file = getattr(bokeh_app, 'data_file', 'redis.db')
        stdout = getattr(bokeh_app, 'stdout', sys.stdout)
        stderr = getattr(bokeh_app, 'stdout', sys.stderr)
        redis_save = getattr(bokeh_app, 'redis_save', True)
        mproc = services.start_redis("bokehpids.json",
                                     bokeh_app.redis_port,
                                     os.getcwd(),
                                     data_file=data_file,
                                     stdout=stdout,
                                     stderr=stderr,
                                     save=redis_save
                                     )
        bokeh_app.redis_proc = mproc
    atexit.register(service_exit)

def service_exit():
    if hasattr(bokeh_app, 'redis_proc'):
        bokeh_app.redis_proc.close()

def start_app(verbose=False):
    global http_server
    http_server = make_server('', PORT, app)
    start_services()
    print("\nStarting Bokeh plot server on port %d..." % PORT)
    print("View http://localhost:%d/bokeh to see plots\n" % PORT)
    http_server.serve_forever()



#database

#logging
