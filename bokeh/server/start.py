from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer
from flask import request, Flask
import gevent
import gevent.monkey
gevent.monkey.patch_all()
import uuid
import socket
import redis

#server imports
from app import app as bokeh_app
import wsmanager
from .. import protocol
from serverbb import ContinuumModelsStorage
from .. import bbmodel
bbmodel.load_special_types()
#import objects so that we can resolve them
import bokeh.objects
import bokeh.glyphs
import models.user as user
import models.convenience as mconv
import models.docs as docs
import os
try:
    from continuumweb import hemlib
    hemlib.slug_path = os.path.dirname(__file__)
except ImportError:
    pass
import logging
import time


PORT = 5006
REDIS_PORT = 6379

log = logging.getLogger(__name__)
app = Flask("bokeh.server")

def prepare_app(rhost='127.0.0.1', rport=REDIS_PORT, start_redis=True):
    #must import views before running apps
    import views.deps
    app.register_blueprint(bokeh_app)
    bokeh_app.redis_port = rport
    bokeh_app.start_redis = start_redis
    bokeh_app.wsmanager = wsmanager.WebSocketManager()
    def auth(auth, docid):
        doc = docs.Doc.load(bokeh_app.model_redis, docid)
        status = mconv.can_write_doc_api(doc, auth, bokeh_app)
        return status
    bokeh_app.wsmanager.register_auth("bokehplot", auth)
    bokeh_app.bb_redis = redis.Redis(host=rhost, port=rport, db=2)
    #for non-backbone models
    bokeh_app.model_redis = redis.Redis(host=rhost, port=rport, db=3)
    bokeh_app.pubsub_redis = redis.Redis(host=rhost, port=rport, db=4)
    bokeh_app.secret_key = str(uuid.uuid4())

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

import services
import os
import atexit
def start_services():
    if bokeh_app.start_redis:
        mproc = services.start_redis("bokehpids.json",
                                     bokeh_app.redis_port, os.getcwd())
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
    print "\nStarting Bokeh plot server on port %d..." % PORT
    print "View http://localhost:%d/bokeh to see plots\n" % PORT
    http_server.serve_forever()



#database

#logging
