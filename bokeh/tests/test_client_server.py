from __future__ import absolute_import, print_function

import unittest

import logging
import bokeh.document as document
from bokeh.application import Application
from bokeh.application.handlers import FunctionHandler
from bokeh.client import pull_session, push_session, ClientSession
from bokeh.server.server import Server
from bokeh.server.session import ServerSession
from bokeh.model import Model
from bokeh.properties import Int, Instance
from tornado.ioloop import IOLoop, PeriodicCallback, _Timeout

class AnotherModelInTestClientServer(Model):
    bar = Int(1)

class SomeModelInTestClientServer(Model):
    foo = Int(2)
    child = Instance(Model)

logging.basicConfig(level=logging.DEBUG)

# lets us use a current IOLoop with "with"
# and ensures the server unlistens
class ManagedServerLoop(object):
    def __init__(self, application):
        loop = IOLoop()
        loop.make_current()
        self._server = Server(application, io_loop=loop)
    def __exit__(self, type, value, traceback):
        self._server.unlisten()
        self._server.io_loop.close()
    def __enter__(self):
        return self._server
    @property
    def io_loop(self):
        return self.s_server.io_loop

class TestClientServer(unittest.TestCase):

    def test_minimal_connect_and_disconnect(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            # we don't have to start the server because it
            # uses the same main loop as the client, so
            # if we start either one it starts both
            session = ClientSession(io_loop = server.io_loop,
                                    url = server.ws_url)
            session.connect()
            assert session.connected
            session.close()
            session.loop_until_closed()
            assert not session.connected

    def test_disconnect_on_error(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            session = ClientSession(url=server.ws_url, io_loop = server.io_loop)
            session.connect()
            assert session.connected
            # send a bogus message using private fields
            session._connection._socket.write_message(b"xx", binary=True)
            # connection should now close on the server side
            # and the client loop should end
            session.loop_until_closed()
            assert not session.connected

    def test_push_document(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            doc = document.Document()
            doc.add_root(AnotherModelInTestClientServer(bar=43))
            doc.add_root(SomeModelInTestClientServer(foo=42))

            client_session = push_session(doc,
                                          session_id='test_push_document',
                                          url=server.ws_url,
                                          io_loop=server.io_loop)

            assert client_session.document == doc
            assert len(client_session.document.roots) == 2

            server_session = server.get_session('/', client_session.id)

            assert len(server_session.document.roots) == 2
            results = {}
            for r in server_session.document.roots:
                if hasattr(r, 'foo'):
                    results['foo'] = r.foo
                if hasattr(r, 'bar'):
                    results['bar'] = r.bar
            assert results['foo'] == 42
            assert results['bar'] == 43

            client_session.close()
            client_session.loop_until_closed()
            assert not client_session.connected

    def test_pull_document(self):
        application = Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestClientServer(bar=43))
            doc.add_root(SomeModelInTestClientServer(foo=42))
        handler = FunctionHandler(add_roots)
        application.add(handler)

        with ManagedServerLoop(application) as server:
            client_session = pull_session(session_id='test_pull_document',
                                          url=server.ws_url,
                                          io_loop=server.io_loop)
            assert len(client_session.document.roots) == 2

            server_session = server.get_session('/', client_session.id)
            assert len(server_session.document.roots) == 2

            results = {}
            for r in server_session.document.roots:
                if hasattr(r, 'foo'):
                    results['foo'] = r.foo
                if hasattr(r, 'bar'):
                    results['bar'] = r.bar
            assert results['foo'] == 42
            assert results['bar'] == 43

            client_session.close()
            client_session.loop_until_closed()
            assert not client_session.connected

    def test_request_server_info(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            session = ClientSession(url=server.ws_url, io_loop=server.io_loop)
            session.connect()
            assert session.connected
            assert session.document is None

            info = session.request_server_info()

            from bokeh import __version__

            assert info['version_info']['bokeh'] == __version__
            assert info['version_info']['server'] == __version__

            session.close()
            session.loop_until_closed()
            assert not session.connected

    def test_client_changes_go_to_server(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            doc = document.Document()
            client_root = SomeModelInTestClientServer(foo=42)

            client_session = push_session(doc, session_id='test_client_changes_go_to_server',
                                          url=server.ws_url,
                                          io_loop=server.io_loop)
            server_session = server.get_session('/', client_session.id)

            assert len(server_session.document.roots) == 0

            doc.add_root(client_root)
            client_session.force_roundtrip() # be sure events have been handled on server

            assert len(server_session.document.roots) == 1
            server_root = next(iter(server_session.document.roots))

            assert client_root.foo == 42
            assert server_root.foo == 42

            # Now try setting title
            assert server_session.document.title == document.DEFAULT_TITLE
            doc.title = "Client Title"
            client_session.force_roundtrip() # be sure events have been handled on server

            assert server_session.document.title == "Client Title"

            # Now modify an attribute on a client model
            client_root.foo = 57

            # there is no great way to block until the server
            # has applied changes, since patches are sent
            # asynchronously. We use internal _loop_until API.
            def server_change_made():
                return server_root.foo == 57
            client_session._connection._loop_until(server_change_made)
            assert server_root.foo == 57

            doc.remove_root(client_root)
            client_session.force_roundtrip() # be sure events have been handled on server
            assert len(server_session.document.roots) == 0

            client_session.close()
            client_session.loop_until_closed()
            assert not client_session.connected

    def test_server_changes_go_to_client(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            doc = document.Document()

            client_session = push_session(doc,
                                          session_id='test_server_changes_go_to_client',
                                          url=server.ws_url,
                                          io_loop=server.io_loop)
            server_session = server.get_session('/', client_session.id)

            assert len(client_session.document.roots) == 0
            server_root = SomeModelInTestClientServer(foo=42)

            def do_add_server_root():
                server_session.document.add_root(server_root)
            server_session.with_document_locked(do_add_server_root)

            def client_has_root():
                return len(doc.roots) > 0
            client_session._connection._loop_until(client_has_root)
            client_root = next(iter(client_session.document.roots))

            assert client_root.foo == 42
            assert server_root.foo == 42

            # Now try setting title on server side
            def do_set_server_title():
                server_session.document.title = "Server Title"
            server_session.with_document_locked(do_set_server_title)

            def client_title_set():
                return client_session.document.title != document.DEFAULT_TITLE
            client_session._connection._loop_until(client_title_set)

            assert client_session.document.title == "Server Title"

            # Now modify a model within the server document
            def do_set_property_on_server():
                server_root.foo = 57
            server_session.with_document_locked(do_set_property_on_server)

            # there is no great way to block until the server
            # has applied changes, since patches are sent
            # asynchronously. We use internal _loop_until API.
            def client_change_made():
                return client_root.foo == 57
            client_session._connection._loop_until(client_change_made)
            assert client_root.foo == 57

            def do_remove_server_root():
                server_session.document.remove_root(server_root)
            server_session.with_document_locked(do_remove_server_root)

            def client_lacks_root():
                return len(doc.roots) == 0
            client_session._connection._loop_until(client_lacks_root)
            assert len(client_session.document.roots) == 0

            client_session.close()
            client_session.loop_until_closed()
            assert not client_session.connected

    def test_io_push_to_server(self):
        from bokeh.io import output_server, push, curdoc, reset_output
        application = Application()
        with ManagedServerLoop(application) as server:
            reset_output()
            doc = curdoc()
            doc.clear()

            client_root = SomeModelInTestClientServer(foo=42)

            session_id = 'test_io_push_to_server'
            output_server(session_id=session_id,
                          url=("http://localhost:%d/" % server.port))

            doc.add_root(client_root)
            push(io_loop=server.io_loop)

            server_session = server.get_session('/', session_id)

            print(repr(server_session.document.roots))

            assert len(server_session.document.roots) == 1
            server_root = next(iter(server_session.document.roots))

            assert client_root.foo == 42
            assert server_root.foo == 42

            # Now modify the client document and push
            client_root.foo = 57
            push(io_loop=server.io_loop)
            server_root = next(iter(server_session.document.roots))
            assert server_root.foo == 57

            # Remove a root and push
            doc.remove_root(client_root)
            push(io_loop=server.io_loop)
            assert len(server_session.document.roots) == 0

            # Clean up global IO state
            reset_output()

    def test_session_periodic_callback(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            doc = document.Document()

            client_session = ClientSession(session_id='test_client_session_callback',
                                          url=server.ws_url,
                                          io_loop=server.io_loop)
            server_session = ServerSession('test_server_session_callback',
                                            doc, server.io_loop)
            client_session._attach_document(doc)

            assert len(server_session._callbacks) == 0
            assert len(client_session._callbacks) == 0

            def cb(): pass
            callback = doc.add_periodic_callback(cb, 1, 'abc')
            server_session2 = ServerSession('test_server_session_callback',
                                            doc, server.io_loop)

            assert server_session2._callbacks
            assert len(server_session._callbacks) == 1
            assert len(client_session._callbacks) == 1

            started_callbacks = []
            for ss in [server_session, server_session2]:
                iocb = ss._callbacks[callback.id]
                assert iocb._period == 1
                assert iocb._loop == server.io_loop
                assert iocb._handle is not None
                started_callbacks.append(iocb)

            for ss in [client_session]:
                iocb = ss._callbacks[callback.id]
                assert isinstance(iocb, PeriodicCallback)
                assert iocb.callback_time == 1
                assert iocb.io_loop == server.io_loop
                assert iocb.is_running()
                started_callbacks.append(iocb)

            callback = doc.remove_periodic_callback(cb)
            assert len(server_session._callbacks) == 0
            assert len(client_session._callbacks) == 0
            assert len(server_session._callbacks) == 0

            for iocb in started_callbacks:
                if hasattr(iocb, '_handle'):
                    assert iocb._handle is None
                else:
                    assert not iocb.is_running()

    def test_session_timeout_callback(self):
        application = Application()
        with ManagedServerLoop(application) as server:
            doc = document.Document()

            client_session = ClientSession(session_id='test_client_session_callback',
                                          url=server.ws_url,
                                          io_loop=server.io_loop)
            server_session = ServerSession('test_server_session_callback',
                                            doc, server.io_loop)
            client_session._attach_document(doc)

            assert len(server_session._callbacks) == 0
            assert len(client_session._callbacks) == 0

            def cb(): pass

            x = server.io_loop.time()
            callback = doc.add_timeout_callback(cb, 10, 'abc')
            server_session2 = ServerSession('test_server_session_callback',
                                            doc, server.io_loop)

            assert server_session2._callbacks
            assert len(server_session._callbacks) == 1
            assert len(client_session._callbacks) == 1

            started_callbacks = []
            for ss in [server_session, client_session, server_session2]:
                iocb = ss._callbacks[callback.id]
                assert isinstance(iocb, _Timeout)

                # check that the callback deadline is 10 seconds later from
                # when we called add_timeout_callback (using int to avoid
                # ms differences between the x definition and the call)
                assert int(iocb.deadline) == int(x + 10)
                started_callbacks.append(iocb)

            callback = doc.remove_periodic_callback(cb)
            assert len(server_session._callbacks) == 0
            assert len(client_session._callbacks) == 0
            assert len(server_session._callbacks) == 0

# This isn't in the unittest.TestCase because per-test fixtures
# don't work there (see note at bottom of https://pytest.org/latest/unittest.html#unittest-testcase)
def test_client_changes_do_not_boomerang(monkeypatch):
    application = Application()
    with ManagedServerLoop(application) as server:
        doc = document.Document()
        client_root = SomeModelInTestClientServer(foo=42)
        doc.add_root(client_root)

        client_session = push_session(doc,
                                      session_id='test_client_changes_do_not_boomerang',
                                      url=server.ws_url,
                                      io_loop=server.io_loop)
        server_session = server.get_session('/', client_session.id)

        assert len(server_session.document.roots) == 1
        server_root = next(iter(server_session.document.roots))

        assert client_root.foo == 42
        assert server_root.foo == 42

        got_angry = {}
        got_angry['result'] = None
        # trap any boomerang
        def get_angry(message):
            got_angry['result'] = message
        monkeypatch.setattr(client_session, '_handle_patch', get_angry)

        # Now modify the client document
        client_root.foo = 57

        # wait until server side change made ... but we may not have the
        # boomerang yet
        def server_change_made():
            return server_root.foo == 57
        client_session._connection._loop_until(server_change_made)
        assert server_root.foo == 57

        # force a round trip to be sure we get the boomerang if we're going to
        client_session.force_roundtrip()

        assert got_angry['result'] is None

        client_session.close()
        client_session.loop_until_closed()
        assert not client_session.connected
        server.unlisten() # clean up so next test can run

# This isn't in the unittest.TestCase because per-test fixtures
# don't work there (see note at bottom of https://pytest.org/latest/unittest.html#unittest-testcase)
def test_server_changes_do_not_boomerang(monkeypatch):
    application = Application()
    with ManagedServerLoop(application) as server:
        doc = document.Document()
        client_root = SomeModelInTestClientServer(foo=42)
        doc.add_root(client_root)

        client_session = push_session(doc,
                                      session_id='test_server_changes_do_not_boomerang',
                                      url=server.ws_url,
                                      io_loop=server.io_loop)
        server_session = server.get_session('/', client_session.id)

        assert len(server_session.document.roots) == 1
        server_root = next(iter(server_session.document.roots))

        assert client_root.foo == 42
        assert server_root.foo == 42

        got_angry = {}
        got_angry['result'] = None
        # trap any boomerang
        def get_angry(message, connection):
            got_angry['result'] = message
        monkeypatch.setattr(server_session, '_handle_patch', get_angry)

        # Now modify the server document
        def do_set_foo_property():
            server_root.foo = 57
        server_session.with_document_locked(do_set_foo_property)

        # there is no great way to block until the server
        # has applied changes, since patches are sent
        # asynchronously. We use internal _loop_until API.
        def client_change_made():
            return client_root.foo == 57
        client_session._connection._loop_until(client_change_made)
        assert client_root.foo == 57

        # force a round trip to be sure we get the boomerang if we're going to
        client_session.force_roundtrip()

        assert got_angry['result'] is None

        client_session.close()
        client_session.loop_until_closed()
        assert not client_session.connected
