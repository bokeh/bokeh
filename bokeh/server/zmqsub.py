from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from threading import Thread
import zmq

timeout = 0.1

class Subscriber(object):
    def __init__(self, addrs, wsmanager):
        self.addrs = addrs
        self.wsmanager = wsmanager
        self.kill = False

    def run(self):
        ctx = zmq.Context()
        sockets = []
        poller = zmq.Poller()
        for addr in self.addrs:
            socket = ctx.socket(zmq.SUB)
            log.debug('SUB CONNECT: %s' % addr)
            socket.connect(addr)
            socket.setsockopt_string(zmq.SUBSCRIBE, u"")
            sockets.append(socket)
            poller.register(socket, zmq.POLLIN)
        try:
            while not self.kill:
                socks = dict(poller.poll(timeout * 1000))
                for socket, v in socks.items():
                    msg = socket.recv_json()
                    topic, msg, exclude = msg['topic'], msg['msg'], msg['exclude']
                    self.wsmanager.send(topic, msg, exclude=exclude)
        finally:
            for s in sockets:
                s.close()

    def start(self):
        self.thread = Thread(target=self.run)
        self.thread.start()

    def stop(self):
        self.kill = True
