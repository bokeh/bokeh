''' Provide a request handler that returns a page displaying a document.

'''
from __future__ import absolute_import, print_function

import logging
log = logging.getLogger(__name__)

from tornado.web import StaticFileHandler

from bokeh.settings import settings

class StaticHandler(StaticFileHandler):
    ''' Implements a custom Tornado static file handler for BokehJS
    JavaScript and CSS resources.

    '''
    def __init__(self, tornado_app, *args, **kw):
        kw['path'] = settings.bokehjsdir()

        # Note: tornado_app is stored as self.application
        super(StaticHandler, self).__init__(tornado_app, *args, **kw)

    # We aren't using tornado's built-in static_path function
    # because it relies on TornadoApplication's autoconfigured
    # static handler instead of our custom one. We have a
    # custom one because we think we might want to serve
    # static files from multiple paths at once in the future.
    @classmethod
    def append_version(cls, path):
        # this version is cached on the StaticFileHandler class,
        # keyed by absolute filesystem path, and only invalidated
        # on an explicit StaticFileHandler.reset(). The reset is
        # automatic on every request if you set
        # static_hash_cache=False in TornadoApplication kwargs.
        version = StaticFileHandler.get_version(dict(static_path=settings.bokehjsdir()), path)
        return ("%s?v=%s" % (path, version))
