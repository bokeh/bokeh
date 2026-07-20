#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

# pyright: reportArgumentType=false, reportGeneralTypeIssues=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from collections.abc import Awaitable
from typing import Any, cast

# External imports
from tornado.web import HTTPError, authenticated

# Bokeh imports
from bokeh.embed.server import server_html_page_for_session

# Bokeh imports
from ..session import ServerSession
from .session_handler import SessionHandler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DocHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class DocHandler(SessionHandler):
    ''' Implements a custom Tornado handler for document display page

    '''
    @authenticated
    async def get(self, *args: Any, **kwargs: Any) -> None:
        session_future = cast("Awaitable[ServerSession | None]", self.get_session())
        session = await session_future
        if session is None:
            raise HTTPError(status_code=403, reason="Invalid token or session ID")

        page = server_html_page_for_session(session,
                                            resources=self.application.resources(),
                                            title=session.document.title,
                                            template=session.document.template,
                                            template_variables=session.document.template_variables)

        self.set_header("Content-Type", 'text/html')
        self.write(page)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
