''' Standard endpoints for a BokehServer application.

'''
from __future__ import absolute_import

from .views.ws import WSHandler
from .views.doc_handler import DocHandler
from .views.static_handler import StaticHandler

toplevel_patterns = [
    # TODO implement /
    # (r'/', SomeHandler),
    (r'/bokehjs/static/(.*)', StaticHandler)
]

# These all get prefixed with the application route, so /foo/ws etc.
per_app_patterns = [
    (r'/?', DocHandler),
    (r'/ws', WSHandler),
]
