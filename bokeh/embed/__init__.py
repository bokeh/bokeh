#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import public, internal ; public, internal

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

from .server import server_document
from .server import server_session

from .standalone import autoload_static
from .standalone import components
from .standalone import file_html

__all__ = (
    'autoload_server',
    'autoload_static',
    'components',
    'file_html',
    'server_document',
    'server_session',
)

# XXXX To be removed
def autoload_server(model=None, app_path=None, session_id=None, url="default", relative_urls=False, arguments=None):
    from bokeh.util.deprecation import deprecated
    deprecated((0, 12, 7), 'bokeh.embed.autoload_server', 'bokeh.embed.server_document or bokeh.embed.server_session')
    if session_id is None:
        return server_document(url, relative_urls, "default", arguments)
    else:
        return server_session(model, session_id, url, relative_urls, "default", arguments)
