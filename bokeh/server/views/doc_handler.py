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
from tornado import gen
from tornado.web import authenticated

# Bokeh imports
from bokeh.embed.server import server_html_page_for_session
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
    @gen.coroutine
    @authenticated
    def get(self, *args, **kwargs):
        session = yield self.get_session()
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
