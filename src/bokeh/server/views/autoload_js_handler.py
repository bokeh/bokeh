#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a request handler that returns a page displaying a document.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from urllib.parse import urlparse

# Bokeh imports
from bokeh.core.templates import AUTOLOAD_JS
from bokeh.embed.bundle import Script, bundle_for_objs_and_resources
from bokeh.embed.elements import script_for_render_items
from bokeh.embed.util import RenderItem

# Bokeh imports
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

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Headers", "*")
        self.set_header('Access-Control-Allow-Methods', 'PUT, GET, OPTIONS')
        self.set_header("Access-Control-Allow-Origin", "*")

    async def get(self, *args, **kwargs):
        session = await self.get_session()

        element_id = self.get_argument("bokeh-autoload-element", default=None)
        if not element_id:
            self.send_error(status_code=400, reason='No bokeh-autoload-element query parameter')
            return

        app_path = self.get_argument("bokeh-app-path", default="/")
        absolute_url = self.get_argument("bokeh-absolute-url", default=None)

        if absolute_url:
            uri = urlparse(absolute_url)
            server_url = f"{uri.scheme}://{uri.netloc}"
        else:
            server_url = None

        resources_param = self.get_argument("resources", "default")
        resources = self.application.resources(server_url) if resources_param != "none" else None
        bundle = bundle_for_objs_and_resources(None, resources)

        render_items = [RenderItem(token=session.token, elementid=element_id, use_for_title=False)]
        bundle.add(Script(script_for_render_items({}, render_items, app_path=app_path, absolute_url=absolute_url)))

        js = AUTOLOAD_JS.render(bundle=bundle, elementid=element_id)

        self.set_header("Content-Type", 'application/javascript')
        self.write(js)

    async def options(self, *args, **kwargs):
        '''Browsers make OPTIONS requests under the hood before a GET request'''

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
