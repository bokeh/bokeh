''' Standard endpoints for a BokehServer application.

'''
from __future__ import absolute_import

from .views.ws import WSHandler

toplevel_patterns = [
    # TODO implement /
    # (r'/', SomeHandler),
]

# These all get prefixed with the application route, so /foo/ws etc.
per_app_patterns = [
    (r'/ws', WSHandler),
]
