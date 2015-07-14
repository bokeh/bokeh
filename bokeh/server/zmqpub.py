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

import json
from threading import Thread

from six.moves.queue import Empty
import zmq

class Publisher(object):
    def __init__(self, ctx, zmqaddr, queue, timeout=0.1):
        self.ctx = ctx
        self.zmqaddr = zmqaddr
        self.queue = queue
        self.timeout = timeout
        self.kill = False

    def run(self):
        log.debug('Publisher starting: %s' % self.zmqaddr)
        socket = self.ctx.socket(zmq.PUB)
        socket.connect(self.zmqaddr)

        try:
            while not self.kill:
                try:
                    message = self.queue.get(timeout=self.timeout)
                    socket.send_string(str(message))
                except Empty:
                    pass
        finally:
            socket.close()

        log.debug('Publisher exiting')

    def send(self, topic, msg, exclude=None):
        exclude = list(exclude or [])
        msg = json.dumps({
            'topic'   : topic,
            'msg'     : msg,
            'exclude' : exclude,
        })
        self.queue.put(msg)

    def start(self):
        self.thread = Thread(target=self.run)
        self.thread.start()

    def stop(self):
        self.kill = True
        if hasattr(self, 'thread'):
            self.thread.join()
