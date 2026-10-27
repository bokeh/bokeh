from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.server.asgi import BokehASGI

from . import lifecycle
from .app import modify_document


class LiveAudio(Application):

    def on_server_loaded(self, server_context):
        lifecycle.on_server_loaded(server_context)
        super().on_server_loaded(server_context)

    def on_server_unloaded(self, server_context):
        lifecycle.on_server_unloaded(server_context)
        super().on_server_unloaded(server_context)


app = BokehASGI(LiveAudio(FunctionHandler(modify_document)))
