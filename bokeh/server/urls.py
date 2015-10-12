''' Standard endpoints for a BokehServer application.

'''
from __future__ import absolute_import

from .views.ws import WSHandler
from .views.doc_handler import DocHandler

toplevel_patterns = [
    # TODO implement /
    # (r'/', SomeHandler),
    # TODO add a static handler for the bokeh JS and CSS
]

# These all get prefixed with the application route, so /foo/ws etc.
per_app_patterns = [
    (r'/', DocHandler),
    (r'/ws', WSHandler),
]
