#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a request handler that returns a page displaying a document.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
from tornado.web import StaticFileHandler

# Bokeh imports
from bokeh.settings import settings

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'StaticHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class StaticHandler(StaticFileHandler):
    ''' Implements a custom Tornado static file handler for BokehJS
    JavaScript and CSS resources.

    '''
    def __init__(self, tornado_app, *args, **kw):
        kw['path'] = settings.bokehjsdir()

        # Note: tornado_app is stored as self.application
        super().__init__(tornado_app, *args, **kw)

    # We aren't using tornado's built-in static_path function
    # because it relies on TornadoApplication's autoconfigured
    # static handler instead of our custom one. We have a
    # custom one because we think we might want to serve
    # static files from multiple paths at once in the future.
    @classmethod
    def append_version(cls, path):
        # This version is cached on the StaticFileHandler class,
        # keyed by absolute filesystem path, and only invalidated
        # on an explicit StaticFileHandler.reset(). The reset is
        # automatic on every request if you set static_hash_cache=False
        # in TornadoApplication kwargs. In dev mode rely on dev tools
        # to manage caching. This improves the ability to debug code.
        if settings.dev:
            return path
        else:
            version = StaticFileHandler.get_version(dict(static_path=settings.bokehjsdir()), path)
            return f"{path}?v={version}"

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
