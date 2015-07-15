#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import zmq
from zmq.devices import ThreadDevice

class Forwarder(object):

    def __init__(self, ctx, input_addr, output_addr):
        self.ctx = ctx
        self.device = ThreadDevice(ctx, zmq.FORWARDER, in_type=zmq.SUB, out_type=zmq.PUB)
        self.device.bind_in(input_addr)
        self.device.bind_out(output_addr)
        self.device.setsockopt_in(zmq.SUBSCRIBE, b"")

    def start(self):
        self.device.start()

    def stop(self):
        self.ctx.term()
        self.device.join()
