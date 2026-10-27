from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.server.asgi import BokehASGI

from .app import modify_document
from .lifecycle import on_server_loaded


class Stocks(Application):

    def on_server_loaded(self, server_context):
        on_server_loaded(server_context)
        super().on_server_loaded(server_context)


app = BokehASGI(Stocks(FunctionHandler(modify_document)))
