from __future__ import absolute_import

import uuid
import threading
import time
import unittest
import mock

import requests
from requests.exceptions import ConnectionError

from ..models import user
from .. import start, configure
from ..app import bokeh_app, app
from ..settings import settings as server_settings

def wait_flask():
    def helper():
        try:
            return requests.get('http://localhost:5006/bokeh/ping')
        except ConnectionError:
            return False
    return wait_until(helper)

def wait_until(func, timeout=1.0, interval=0.01):
    st = time.time()
    while True:
        if func():
            return True
        if (time.time() - st) > timeout:
            return False
        time.sleep(interval)

class BaseBokehServerTestCase(unittest.TestCase):

    options = {}

class MemoryBokehServerTestCase(BaseBokehServerTestCase):
    def setUp(self):
        # clear tornado ioloop instance
        server_settings.reset()
        server_settings.model_backend = {'type' : 'memory'}
        for k,v in self.options.items():
            setattr(server_settings, k, v)
        bokeh_app.stdout = None
        bokeh_app.stderr = None
        self.serverthread = threading.Thread(target=start.start_simple_server)
        self.serverthread.start()
        wait_flask()
        # not great - but no good way to wait for zmq to come up
        time.sleep(0.1)
        make_default_user(bokeh_app)

    def tearDown(self):
        start.stop()
        self.serverthread.join()

BokehServerTestCase = MemoryBokehServerTestCase

def make_default_user(bokeh_app):
    bokehuser = user.new_user(bokeh_app.servermodel_storage, "defaultuser",
                              str(uuid.uuid4()), apikey='nokey', docs=[])
    return bokehuser

class FlaskClientTestCase(BaseBokehServerTestCase):
    def setUp(self):
        server_settings.reset()
        for k,v in self.options.items():
            setattr(server_settings, k, v)
        server_settings.model_backend = {'type' : 'memory'}
        configure.configure_flask()
        with mock.patch('bokeh.server.configure.logging'):
            configure.register_blueprint()
        #ugh..need better way to initialize this
        app.secret_key = server_settings.secret_key
        app.debug = True
        self.client = app.test_client()

    def tearDown(self):
        pass
