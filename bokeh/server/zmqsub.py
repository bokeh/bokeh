from threading import Thread
try:
    import gevent
    import zmq.green as zmq
except ImportError:
    import zmq

timeout = 1

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
            socket.connect(addr)
            sockets.append(socket)
            poller.register(socket, zmq.POLLIN)
        try:
            while not self.kill:
                socks = dict(poller.poll(timeout * 1000))
                for socket, v in socks.items():
                    msg = socket.recv()
                    topic, msg, exclude = msg['topic'], msg['msg'], msg['exclude']
                    self.wsmanager.send(topic, msg, exclude=exclude)
        finally:
            for s in sockets:
                s.close()

    def send(self, msg):
        self.queue.put(msg)

    def start(self):
        self.thread = Thread(target=self.run)
        self.thread.start()
