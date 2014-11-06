
import tempfile
import threading
import time
import unittest

#import redis
import requests
from requests.exceptions import ConnectionError
from tornado import ioloop
#import zmq

from bokeh.tests.test_utils import skipIfPy3

from .. import start
from ..app import bokeh_app
from ..settings import settings as server_settings

def wait_flask():
    def helper():
        try:
            return requests.get('http://localhost:5006/bokeh/ping')
        except ConnectionError:
            return False
    return wait_until(helper)


def wait_redis_gone(port):
    def helper():
        client = redis.Redis(port=port)
        try:
            client.ping()
            return False
        except redis.ConnectionError:
            return True
    return wait_until(helper)


def wait_redis_start(port):
    def helper():
        client = redis.Redis(port=port)
        try:
            return client.ping()
        except redis.ConnectionError:
            pass
    return wait_until(helper)


def wait_until(func, timeout=1.0, interval=0.01):
    st = time.time()
    while True:
        if func():
            return True
        if (time.time() - st) > timeout:
            return False
        time.sleep(interval)


def recv_timeout(socket, timeout):
    poll = zmq.Poller()
    poll.register(socket, zmq.POLLIN)
    socks = dict(poll.poll(timeout=timeout))
    if socks.get(socket, None) == zmq.POLLIN:
        return socket.recv_multipart()
    else:
        return None

class BaseBokehServerTestCase(unittest.TestCase):

    options = {}

class MemoryBokehServerTestCase(BaseBokehServerTestCase):
    @skipIfPy3("gevent does not work in py3.")
    def setUp(self):
        #clear tornado ioloop instance
        settings.backend = {'type' : 'memory'}
        if hasattr(ioloop.IOLoop, '_instance'):
            del ioloop.IOLoop._instance
        start.prepare_app({"type": "memory"}, **self.options)
        websocket = {
            "zmqaddr" : "tcp://127.0.0.1:6010",
            "no_ws_start" : False,
            "ws_port" : 6009,
        }
        start.configure_websocket(websocket)
        start.register_blueprint()
        bokeh_app.stdout = None
        bokeh_app.stderr = None
        self.serverthread = threading.Thread(target=start.start_app)
        self.serverthread.start()
        start.make_default_user(bokeh_app)
        wait_flask()

    def tearDown(self):
        start.stop()
        self.serverthread.join()

BokehServerTestCase = MemoryBokehServerTestCase
