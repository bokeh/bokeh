#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a request handler that returns a page displaying a document.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
from six.moves.urllib.parse import urlparse
from tornado import gen

# Bokeh imports
from bokeh.core.templates import AUTOLOAD_JS
from bokeh.util.string import encode_utf8
from bokeh.embed.bundle import bundle_for_objs_and_resources, Script
from bokeh.embed.elements import script_for_render_items
from bokeh.embed.util import RenderItem

from .session_handler import SessionHandler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AutoloadJsHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class AutoloadJsHandler(SessionHandler):
    ''' Implements a custom Tornado handler for the autoload JS chunk

    '''
    @gen.coroutine
    def get(self, *args, **kwargs):
        session = yield self.get_session()

        element_id = self.get_argument("bokeh-autoload-element", default=None)
        if not element_id:
            self.send_error(status_code=400, reason='No bokeh-autoload-element query parameter')
            return

        app_path = self.get_argument("bokeh-app-path", default="/")
        absolute_url = self.get_argument("bokeh-absolute-url", default=None)

        if absolute_url:
            server_url = '{uri.scheme}://{uri.netloc}'.format(uri=urlparse(absolute_url))
        else:
            server_url = None

        resources_param = self.get_argument("resources", "default")
        resources = self.application.resources(server_url) if resources_param != "none" else None
        bundle = bundle_for_objs_and_resources(None, resources)

        render_items = [RenderItem(sessionid=session.id, elementid=element_id, use_for_title=False)]
        bundle.add(Script(script_for_render_items(None, render_items, app_path=app_path, absolute_url=absolute_url)))

        js = AUTOLOAD_JS.render(bundle=bundle, elementid=element_id)

        self.set_header("Content-Type", 'application/javascript')
        self.write(encode_utf8(js))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
