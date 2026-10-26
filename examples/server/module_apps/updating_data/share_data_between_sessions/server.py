"""Own one data producer using Bokeh application lifecycle hooks."""

from math import pi
from threading import Event, Thread

from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.server.asgi import BokehASGI

from .app import apply_snapshot, latest, make_snapshot, modify_document


def modify_session(doc):
    modify_document(doc)
    doc.add_periodic_callback(lambda: apply_snapshot(doc, latest.read()), 100)


class SharedData(Application):

    def on_server_loaded(self, server_context):
        super().on_server_loaded(server_context)
        self.stop = Event()

        def produce():
            phase = 0.0
            while not self.stop.is_set():
                latest.replace(make_snapshot(phase))
                phase = (phase + 0.12) % (2 * pi)
                self.stop.wait(0.1)

        self.producer = Thread(target=produce, daemon=True)
        self.producer.start()

    def on_server_unloaded(self, server_context):
        self.stop.set()
        self.producer.join()
        super().on_server_unloaded(server_context)


app = BokehASGI(SharedData(FunctionHandler(modify_session)))
