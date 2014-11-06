import zmq
from zmq.devices import ThreadDevice

class Forwarder(object):
    def __init__(self, input_addr, output_addr):
        self.device = ThreadDevice(zmq.FORWARDER, in_type=zmq.SUB, out_type=zmq.PUB)
        self.device.bind_in(input_addr)
        self.device.bind_out(output_addr)
        self.device.setsockopt_in(zmq.SUBSCRIBE, "")

    def start(self):
        self.device.start()

    def stop(self):
        self.device._context.term()
        self.device.join()
