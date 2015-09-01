''' Standard endpoints for a BokehServer application.

'''
from __future__ import absolute_import

from .ws_handler import WSHandler

patterns = [
    (r'/ws', WSHandler),
]