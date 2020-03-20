#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define standard endpoints and their associated views for a Bokeh Server
application.

These will be added by the :class:`~bokeh.server.tornado.BokehTornado`
application. The Bokeh Tornado application can then be served using Tornado's
built-in ``HTTPServer``.

.. data:: toplevel_patterns
    :annotation:

    Top-level routes, independent of any applications. They will be prefixed
    with any configured prefix.

    .. code-block:: python

        [
            ( r'/?',           RootHandler   ), # <prefix>/
            ( r'/static/(.*)', StaticHandler ), # <prefix>/static/
        ]

.. data:: per_app_patterns
    :annotation:

    Per-application routes. These be prefixed with the application path, as
    well as with any configured prefix.

    .. code-block:: python

        [
            ( r'/?',           DocHandler        ), # <prefix>/<app>/
            ( r'/ws',          WSHandler         ), # <prefix>/<app>/ws
            ( r'/metadata',    MetadataHandler   ), # <prefix>/<app>/metadata
            ( r'/autoload.js', AutoloadJsHandler ), # <prefix>/<app>/autoload.js
        ]

'''
# Please update the docstring above if any changes are made below

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..embed.bundle import extension_dirs
from .views.autoload_js_handler import AutoloadJsHandler
from .views.doc_handler import DocHandler
from .views.metadata_handler import MetadataHandler
from .views.multi_root_static_handler import MultiRootStaticHandler
from .views.root_handler import RootHandler
from .views.static_handler import StaticHandler
from .views.ws import WSHandler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'per_app_patterns',
    'toplevel_patterns',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

toplevel_patterns = [
    (r'/?', RootHandler),
    (r'/static/extensions/(.*)', MultiRootStaticHandler, dict(root=extension_dirs)),
    (r'/static/(.*)', StaticHandler),
]

per_app_patterns = [
    (r'/?', DocHandler),
    (r'/ws', WSHandler),
    (r'/metadata', MetadataHandler),
    (r'/autoload.js', AutoloadJsHandler),
]

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
