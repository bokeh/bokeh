#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import


from tornado.web import Application, FallbackHandler
from tornado.wsgi import WSGIContainer

from .blueprint import bokeh_blueprint
from .models import convenience as mconv
from .models import docs
from .websocket import WebSocketHandler, WebSocketManager
from .zmq import Forwarder, Subscriber


class SimpleBokehTornadoApp(Application):
    def __init__(self, flask_app, ctx, pub_zmqaddr, sub_zmqaddr, **kw):
        url_prefix = flask_app.config['URL_PREFIX']
        handlers = [
            (url_prefix + "/bokeh/sub", WebSocketHandler),
            (r".*", FallbackHandler, dict(fallback=WSGIContainer(flask_app)))
        ]
        super(SimpleBokehTornadoApp, self).__init__(handlers, **kw)

        self.wsmanager = WebSocketManager()

        def auth(auth, docid):
            # TODO (bev) this old code needs improvement
            if docid.startswith("temporary-"):
                return True
            doc = docs.Doc.load(bokeh_blueprint.servermodel_storage, docid)
            status = mconv.can_read_doc_api(doc, auth)
            return status
        self.wsmanager.register_auth('bokehplot', auth)

        self.subscriber = Subscriber(ctx, [sub_zmqaddr], self.wsmanager)

        if flask_app.config['RUN_FORWARDER']:
            self.forwarder = Forwarder(ctx, pub_zmqaddr, sub_zmqaddr)
        else:
            self.forwarder = None

    def start_threads(self):
        bokeh_blueprint.publisher.start()
        self.subscriber.start()
        if self.forwarder:
            self.forwarder.start()

    def stop_threads(self):
        bokeh_blueprint.publisher.stop()
        self.subscriber.stop()
        if self.forwarder:
            self.forwarder.stop()

def create_tornado_app(flask_app):
    ctx = flask_app.config['ctx']
    pub_zmqaddr = flask_app.config['PUB_ZMQADDR']
    sub_zmqaddr = flask_app.config['SUB_ZMQADDR']
    debug = flask_app.config['DEBUG']
    tornado_app = SimpleBokehTornadoApp(flask_app, ctx, pub_zmqaddr, sub_zmqaddr, debug=debug)
    tornado_app.start_threads()
    return tornado_app



