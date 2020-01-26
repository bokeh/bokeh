#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
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
from tornado.web import authenticated

# Bokeh imports
from bokeh.embed.server import server_html_page_for_session

# Bokeh imports
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
    async def get(self, *args, **kwargs):
        session = await self.get_session()

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
