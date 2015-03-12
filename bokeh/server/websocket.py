from __future__ import absolute_import

import logging
log = logging.getLogger(__name__)

import threading
import uuid

from tornado import websocket, ioloop
from tornado.web import Application
from tornado.httpserver import HTTPServer

from bokeh import protocol

from .wsmanager import WebSocketManager
from .zmqsub import Subscriber

class WebSocketHandler(websocket.WebSocketHandler):
    @property
    def manager(self):
        return self.application.wsmanager

    #accept all domains for now.. maybe rethink this later?
    def check_origin(self, origin):
        return True

    def open(self):
        ## TODO - set client id to continuum client id
        self.clientid = str(uuid.uuid4())
        self.manager.add_socket(self, self.clientid)

    def on_close(self):
        self.manager.remove_socket(self.clientid)

    def on_message(self, message):
        msgobj = protocol.deserialize_json(message)
        msgtype = msgobj.get('msgtype')
        if msgtype == 'subscribe':
            auth = msgobj['auth']
            topic = msgobj['topic']
            if self.manager.auth(auth, topic):
                self.manager.subscribe(self.clientid, topic)
                msg = protocol.serialize_json(
                    protocol.status_obj(['subscribesuccess', topic, self.clientid])
                )
                self.write_message(topic + ":" + msg)
            else:
                msg = protocol.serialize_web(protocol.error_obj('unauthorized'))
                self.write_message(topic + ":" + msg)


class TornadoWebSocketApplication(Application):
    def __init__(self, handlers, **settings):
        super(TornadoWebSocketApplication, self).__init__(handlers, **settings)
        self.wsmanager = WebSocketManager()
        zmqaddrs = settings.pop('zmqaddrs')
        self.subscriber = Subscriber(zmqaddrs, self.wsmanager)

    def stop(self):
        ## Hugo:  not sure how this is supposed to work
        ## but apparently you need to stop and then
        ## start the tornado loop to get it to finish....
        ioloop.IOLoop.instance().stop()
        self.server.stop()
        self.subscriber.kill = True
        self.subscriber.thread.join()
        if hasattr(self, 'thread'):
            self.thread.join()

    def start(self, thread=False):
        def helper():
            self.subscriber.start()
            ioloop.IOLoop.instance().start()
        if thread:
            self.thread = threading.Thread(target=helper)
            self.thread.start()
        else:
            helper()

    def set_server(self, server):
        self.server = server

    def listen(self, port, address="", **kwargs):
        self.server = HTTPServer(self, **kwargs)
        self.server.listen(port, address)

def make_app(url_prefix, zmqaddrs, port):
    if url_prefix is None or url_prefix == "/":
        url = "/bokeh/sub/"
    else:
        if not url_prefix.startswith("/"):
            url_prefix = "/" + url_prefix
        if not url_prefix.endswith("/"):
            url_prefix = url_prefix + "/"
        url = url_prefix + "bokeh/sub/"
    application = TornadoWebSocketApplication([(url, WebSocketHandler)],
                                              zmqaddrs=zmqaddrs
    )
    application.listen(port)
    return application
