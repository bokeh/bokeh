from __future__ import absolute_import, print_function

from bokeh.server.server import Server
from tornado.ioloop import IOLoop
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from tornado.websocket import websocket_connect

def url(server, prefix=""):
    return "http://localhost:" + str(server.port) + prefix + "/"

def ws_url(server, prefix=""):
    return "ws://localhost:" + str(server.port) + prefix + "/ws"

def http_get(io_loop, url):
    result = {}
    def handle_request(response):
        result['response'] = response
        io_loop.stop()

    # for some reason passing a loop to AsyncHTTPClient is deprecated
    assert io_loop is IOLoop.current()
    http_client = AsyncHTTPClient()
    headers = dict()
    http_client.fetch(url, handle_request, headers=headers)
    io_loop.start()

    if 'response' not in result:
        raise RuntimeError("Failed to http get")
    response = result['response']
    if response.error:
        raise response.error
    else:
        return response

def websocket_open(io_loop, url, origin=None):
    result = {}
    def handle_connection(future):
        result['connection'] = future
        io_loop.stop()

    request = HTTPRequest(url)
    if origin is not None:
        request.headers['Origin'] = origin
    websocket_connect(request, callback=handle_connection, io_loop=io_loop)

    io_loop.start()

    if 'connection' not in result:
        raise RuntimeError("Failed to handle websocket connect")
    future = result['connection']
    if future.exception():
        raise future.exception()
    else:
        future.result().close()
        return None

# lets us use a current IOLoop with "with"
# and ensures the server unlistens
class ManagedServerLoop(object):
    def __init__(self, application, **server_kwargs):
        loop = IOLoop()
        loop.make_current()
        server_kwargs['io_loop'] = loop
        self._server = Server(application, **server_kwargs)
    def __exit__(self, type, value, traceback):
        self._server.unlisten()
        self._server.stop()
        self._server.io_loop.close()
    def __enter__(self):
        self._server.start()
        return self._server
    @property
    def io_loop(self):
        return self.s_server.io_loop
