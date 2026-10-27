from bokeh.server.asgi import BokehASGI

from .app import modify_document
from .auth import policy

app = BokehASGI(modify_document, auth_policy=policy)
