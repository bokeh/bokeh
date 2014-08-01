from threading import Thread
from Queue import Empty
import json

try:
    import gevent
    import zmq.green as zmq
except ImportError:
    import zmq

timeout = 0.1

class Publisher(object):
    def __init__(self, zmqaddr, queue):
        self.zmqaddr = zmqaddr
        self.queue = queue
        self.kill = False

    def run(self):
        print('zmqpub starting')
        ctx = zmq.Context()
        socket = ctx.socket(zmq.PUB)
        socket.bind(self.zmqaddr)
        try:
            while not self.kill:
                try:
                    message = self.queue.get(timeout=timeout)
                    socket.send(str(message))
                except Empty:
                    pass
        finally:
            socket.close()
        print('zmqpub exiting')
    def send(self, topic, msg, exclude=[]):
        msg = json.dumps({'topic' : topic,
                          'msg' : msg,
                          'exclude' : list(exclude)})
        self.queue.put(msg)

    def start(self):
        self.thread = Thread(target=self.run)
        self.thread.start()

    def stop(self):
        self.kill = True
        if hasattr(self, 'thread'):
            self.thread.join()
