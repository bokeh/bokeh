''' Standard endpoints for a BokehServer application.

'''
from __future__ import absolute_import

from .views.ws import WSHandler
from .views.root_handler import RootHandler
from .views.doc_handler import DocHandler
from .views.static_handler import StaticHandler
from .views.autoload_js_handler import AutoloadJsHandler

# all routes are prefixed with any --prefix specified

toplevel_patterns = [
    (r'/?', RootHandler),
    (r'/static/(.*)', StaticHandler)
]

# these all also get prefixed with the application route
per_app_patterns = [
    (r'/?', DocHandler),
    (r'/ws', WSHandler),
    (r'/autoload.js', AutoloadJsHandler)
]
