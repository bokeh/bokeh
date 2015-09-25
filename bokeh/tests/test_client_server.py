from __future__ import absolute_import, print_function

import unittest

import logging
import bokeh.document as document
from bokeh.application import Application
from bokeh.client import ClientConnection
from bokeh.server.server import Server
from bokeh.plot_object import PlotObject
from bokeh.properties import Int, Instance
from tornado.ioloop import IOLoop

class AnotherModel(PlotObject):
    bar = Int(1)

class SomeModel(PlotObject):
    foo = Int(2)
    child = Instance(PlotObject)

logging.basicConfig(level=logging.DEBUG)

# lets us use a current IOLoop with "with"
class CurrentLoop(object):
    def __init__(self):
        self._loop = IOLoop()
        self._loop.make_current()
    def __exit__(self, type, value, traceback):
        self._loop.close()
    def __enter__(self):
        pass

class TestClientServer(unittest.TestCase):

    def test_minimal_connect_and_disconnect(self):
        with CurrentLoop():
            application = Application()
            server = Server(application)
            # we don't have to start the server because it
            # uses the same main loop as the client, so
            # if we start either one it starts both
            connection = ClientConnection()
            connection.connect()
            assert connection.connected
            connection.close()
            connection.loop_until_closed()
            assert not connection.connected
            server.unlisten() # clean up so next test can run

    def test_disconnect_on_error(self):
        with CurrentLoop():
            application = Application()
            server = Server(application)
            connection = ClientConnection()
            connection.connect()
            assert connection.connected
            # send a bogus message
            connection._socket.write_message(b"xx", binary=True)
            # connection should now close on the server side
            # and the client loop should end
            connection.loop_until_closed()
            assert not connection.connected
            server.unlisten()

    def test_push_document(self):
        with CurrentLoop():
            application = Application()
            server = Server(application)

            connection = ClientConnection()
            connection.connect()
            assert connection.connected

            doc = document.Document()
            doc.add_root(AnotherModel(bar=43))
            doc.add_root(SomeModel(foo=42))

            client_session = connection.push_session(doc)
            assert client_session.document == doc
            assert len(client_session.document.roots) == 2

            server_session = server.get_session(client_session.id)

            assert len(server_session.document.roots) == 2
            results = {}
            for r in server_session.document.roots:
                if hasattr(r, 'foo'):
                    results['foo'] = r.foo
                if hasattr(r, 'bar'):
                    results['bar'] = r.bar
            assert results['foo'] == 42
            assert results['bar'] == 43

            connection.close()
            connection.loop_until_closed()
            assert not connection.connected
            server.unlisten() # clean up so next test can run
