from pathlib import Path

from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.application.handlers.handler import Handler
from bokeh.server.asgi import BokehASGI

from .app import modify_document


class Assets(Handler):

    def modify_document(self, doc):
        pass

    def static_path(self):
        return str(Path(__file__).parent / "static")


app = BokehASGI(Application(FunctionHandler(modify_document), Assets()))
