#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a request handler that returns a favicon.ico.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportIncompatibleMethodOverride=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# External imports
from tornado.web import HTTPError, RequestHandler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'IcoHandler',
)


#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class IcoHandler(RequestHandler):
    ''' Implements a custom Tornado request handler for favicon.ico
    files.

    '''

    app: Any

    def initialize(self, *args: Any, **kw: Any) -> None:
        self.app = kw.get("app")

    async def get(self, *args: Any, **kwargs: Any) -> Any:
        app = self.app
        assert app is not None

        if app.icon is None:
            raise HTTPError(status_code=404)

        self.set_header("Content-Type", "image/x-icon")
        self.write(app.icon)
        return self.flush()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
