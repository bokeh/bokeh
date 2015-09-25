from __future__ import absolute_import, print_function

import unittest

import logging
import bokeh.document as document
from bokeh.application import Application
from bokeh.client import ClientConnection
from bokeh.server.server import Server
from bokeh.plot_object import PlotObject
from bokeh.properties import Int, Instance

class AnotherModel(PlotObject):
    bar = Int(1)

class SomeModel(PlotObject):
    foo = Int(2)
    child = Instance(PlotObject)

logging.basicConfig(level=logging.DEBUG)

class TestClientServer(unittest.TestCase):

    def test_minimal_connect_and_disconnect(self):
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


