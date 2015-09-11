''' Standard endpoints for a BokehServer application.

'''
from __future__ import absolute_import

from .views.ws import WSHandler

patterns = [
    (r'/ws', WSHandler),
]
