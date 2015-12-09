from __future__ import absolute_import, print_function

import unittest

from bokeh.server.protocol import Protocol

class TestPingReq(unittest.TestCase):

    def test_create(self):
        msg = Protocol("1.0").create("PING-REQ", 42)
