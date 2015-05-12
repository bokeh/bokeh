from __future__ import absolute_import

import zmq
from zmq.devices import ThreadDevice as ZMQThreadDevice

class ThreadDevice(ZMQThreadDevice):

    def __init__(self, ctx, device_type=zmq.QUEUE, in_type=None, out_type=None):
        self.ctx = ctx
        # XXX: super(ThreadDevice, self).__init__(device_type, in_type, out_type)
        #      but ZMQThreadDevice is an old-style class (yay!).
        ZMQThreadDevice.__init__(self, device_type, in_type, out_type)

    def context_factory(self):
        return self.ctx

class Forwarder(object):
    def __init__(self, ctx, input_addr, output_addr):
        self.device = ThreadDevice(ctx, zmq.FORWARDER, in_type=zmq.SUB, out_type=zmq.PUB)
        self.device.bind_in(input_addr)
        self.device.bind_out(output_addr)
        self.device.setsockopt_in(zmq.SUBSCRIBE, b"")

    def start(self):
        self.device.start()

    def stop(self):
        self.device.ctx.term()
        self.device.join()
