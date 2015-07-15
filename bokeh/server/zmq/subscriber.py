#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2015, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from threading import Thread

import zmq

class Subscriber(object):
    def __init__(self, ctx, addrs, wsmanager, timeout=0.1):
        self.ctx = ctx
        self.addrs = addrs
        self.wsmanager = wsmanager
        self.timeout = timeout
        self.kill = False

    def run(self):
        sockets = []
        poller = zmq.Poller()
        for addr in self.addrs:
            log.debug('Subscriber CONNECT: %s' % addr)
            socket = self.ctx.socket(zmq.SUB)
            socket.connect(addr)
            socket.setsockopt_string(zmq.SUBSCRIBE, u"")
            sockets.append(socket)
            poller.register(socket, zmq.POLLIN)
        try:
            while not self.kill:
                socks = dict(poller.poll(self.timeout * 1000))
                for socket, v in socks.items():
                    msg = socket.recv_json()
                    topic, msg, exclude = msg['topic'], msg['msg'], msg['exclude']
                    self.wsmanager.send(topic, msg, exclude=exclude)
        except zmq.ContextTerminated:
            pass
        finally:
            for s in sockets:
                s.close()

    def start(self):
        self.thread = Thread(target=self.run)
        self.thread.start()

    def stop(self):
        self.kill = True
