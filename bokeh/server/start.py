from __future__ import absolute_import, print_function
import gevent.monkey
gevent.monkey.patch_all()

from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer
from flask import request, Flask

import uuid
import socket
import redis

#server imports
from .app import app as bokeh_app
from . import wsmanager
#import objects so that we can resolve them
from .. import protocol, objects, glyphs
from .models import user, docs
from .models import convenience as mconv
import os
from os.path import join, dirname
import logging
import time


PORT = 5006
REDIS_PORT = 6379

log = logging.getLogger(__name__)
app = Flask("bokeh.server")

def prepare_app(rhost='127.0.0.1', rport=REDIS_PORT, start_redis=True):
    #must import views before running apps
    from .views import deps
    bokeh_app.setup(rport, start_redis)
    app.register_blueprint(bokeh_app)
    bokeh_app.bb_redis = redis.Redis(host=rhost, port=rport, db=2)
    #for non-backbone models
    bokeh_app.model_redis = redis.Redis(host=rhost, port=rport, db=3)
    bokeh_app.pubsub_redis = redis.Redis(host=rhost, port=rport, db=4)

def make_default_user(bokeh_app):
    docid = "defaultdoc"
    bokehuser = user.new_user(bokeh_app.model_redis, "defaultuser",
                              str(uuid.uuid4()), apikey='nokey', docs=[])

    return bokehuser

def prepare_local():
    #monkeypatching
    def current_user(request):
        bokehuser = user.User.load(bokeh_app.model_redis, "defaultuser")
        if bokehuser is None:
            bokehuser = make_default_user(bokeh_app)
        return bokehuser
    def write_plot_file(username, codedata):
        return
    bokeh_app.current_user = current_user
    bokeh_app.write_plot_file = write_plot_file

http_server = None

from . import services
import os
import atexit
def start_services():
    if bokeh_app.start_redis:
        #for tests:
        data_file = getattr(bokeh_app, 'data_file', 'redis.db')
        mproc = services.start_redis("bokehpids.json",
                                     bokeh_app.redis_port, 
                                     os.getcwd(),
                                     #data_file=data_file
                                     )
        bokeh_app.redis_proc = mproc
    atexit.register(service_exit)

def service_exit():
    if hasattr(bokeh_app, 'redis_proc'):
        bokeh_app.redis_proc.close()

def start_app(verbose=False):
    global http_server
    start_services()
    http_server = WSGIServer(('', PORT), app,
                             handler_class=WebSocketHandler,
                             )
    print("Starting Bokeh plot server on port %d..." % PORT)
    print("View http://localhost:%d/bokeh to see plots\n" % PORT)
    http_server.serve_forever()



#database

#logging
