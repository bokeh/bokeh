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
# and ensures the server unlistens
class ManagedServerLoop(object):
    def __init__(self, application):
        self._loop = IOLoop()
        self._loop.make_current()
        self._server = Server(application)
    def __exit__(self, type, value, traceback):
        self._server.unlisten()
        self._loop.close()
    def __enter__(self):
        return self._server

class TestClientServer(unittest.TestCase):

    def test_minimal_connect_and_disconnect(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            # we don't have to start the server because it
            # uses the same main loop as the client, so
            # if we start either one it starts both
            connection = ClientConnection()
            connection.connect()
            assert connection.connected
            connection.close()
            connection.loop_until_closed()
            assert not connection.connected

    def test_disconnect_on_error(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            connection = ClientConnection(url=server.ws_url)
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
        application = Application()
        with ManagedServerLoop(application) as server:
            connection = ClientConnection(url=server.ws_url)
            connection.connect()
            assert connection.connected

            doc = document.Document()
            doc.add_root(AnotherModel(bar=43))
            doc.add_root(SomeModel(foo=42))

            client_session = connection.push_session(doc, 'test_push_document')
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

    def test_request_server_info(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            connection = ClientConnection(url=server.ws_url)
            connection.connect()
            assert connection.connected

            info = connection.request_server_info()

            from bokeh import __version__

            assert info['version_info']['bokeh'] == __version__
            assert info['version_info']['server'] == __version__

            connection.close()
            connection.loop_until_closed()
            assert not connection.connected
            server.unlisten() # clean up so next test can run

    def test_client_changes_go_to_server(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            connection = ClientConnection(url=server.ws_url)
            connection.connect()
            assert connection.connected

            doc = document.Document()
            client_root = SomeModel(foo=42)
            doc.add_root(client_root)

            client_session = connection.push_session(doc, 'test_client_changes_go_to_server')
            server_session = server.get_session(client_session.id)

            assert len(server_session.document.roots) == 1
            server_root = next(iter(server_session.document.roots))

            assert client_root.foo == 42
            assert server_root.foo == 42

            # Now modify the client document
            client_root.foo = 57

            # there is no great way to block until the server
            # has applied changes, since patches are sent
            # asynchronously. We use internal _loop_until API.
            def server_change_made():
                print("server foo " + str(server_root.foo))
                return server_root.foo == 57
            connection._loop_until(server_change_made)
            assert server_root.foo == 57

            connection.close()
            connection.loop_until_closed()
            assert not connection.connected
            server.unlisten() # clean up so next test can run

    def test_server_changes_go_to_client(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            connection = ClientConnection(url=server.ws_url)
            connection.connect()
            assert connection.connected

            doc = document.Document()
            client_root = SomeModel(foo=42)
            doc.add_root(client_root)

            client_session = connection.push_session(doc, 'test_client_changes_go_to_server')
            server_session = server.get_session(client_session.id)

            assert len(server_session.document.roots) == 1
            server_root = next(iter(server_session.document.roots))

            assert client_root.foo == 42
            assert server_root.foo == 42

            # Now modify the server document
            server_root.foo = 57

            # there is no great way to block until the server
            # has applied changes, since patches are sent
            # asynchronously. We use internal _loop_until API.
            def client_change_made():
                print("client foo " + str(client_root.foo))
                return client_root.foo == 57
            connection._loop_until(client_change_made)
            assert client_root.foo == 57

            connection.close()
            connection.loop_until_closed()
            assert not connection.connected
            server.unlisten() # clean up so next test can run
