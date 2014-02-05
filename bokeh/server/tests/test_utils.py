import unittest
import tempfile
import redis
import time
import redis
from requests.exceptions import ConnectionError
import requests

from ..app import bokeh_app
from .. import start

def wait_flask():
    def helper():
        try:
            return requests.get('http://localhost:5006/bokeh/ping')
        except ConnectionError as e:
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
	
class BokehServerTestCase(unittest.TestCase):
    options = {}
    def setUp(self):
        import gevent
        start.prepare_app(rport=6899, **self.options)
        fname = tempfile.NamedTemporaryFile().name
        bokeh_app.data_file = fname
        bokeh_app.stdout = None
        bokeh_app.stderr = None
        bokeh_app.redis_save = False
        self.servert = gevent.spawn(start.start_app)
        wait_redis_start(6899)
        redis.Redis(port=6899).flushall()
        start.make_default_user(bokeh_app)
        wait_flask()
        
    def tearDown(self):
        self.servert.kill()
        bokeh_app.redis_proc.close()
        wait_redis_gone(6899)
    
