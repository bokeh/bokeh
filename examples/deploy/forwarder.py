import time

from bokeh.server.settings import Settings
from bokeh.server.zmq.forwarder import Forwarder
import zmq

if __name__ == "__main__":
    forwarder = Forwarder(zmq.Context(), Settings.PUB_ZMQADDR, Settings.SUB_ZMQADDR)

    try:
        forwarder.start()
        while True: time.sleep(10)
    except KeyboardInterrupt:
        forwarder.stop()
