#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Internal utility functions used by ``bokeh.client``

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

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def server_url_for_websocket_url(url):
    ''' Convert an ``ws(s)`` URL for a Bokeh server into the appropriate
    ``http(s)`` URL for the websocket endpoint.

    Args:
        url (str):
            An ``ws(s)`` URL ending in ``/ws``

    Returns:
        str:
            The corresponding ``http(s)`` URL.

    Raises:
        ValueError:
            If the input URL is not of the proper form.

    '''
    if url.startswith("ws:"):
        reprotocoled = "http" + url[2:]
    elif url.startswith("wss:"):
        reprotocoled = "https" + url[3:]
    else:
        raise ValueError("URL has non-websocket protocol " + url)
    if not reprotocoled.endswith("/ws"):
        raise ValueError("websocket URL does not end in /ws")
    return reprotocoled[:-2]

def websocket_url_for_server_url(url):
    ''' Convert an ``http(s)`` URL for a Bokeh server websocket endpoint into
    the appropriate ``ws(s)`` URL

    Args:
        url (str):
            An ``http(s)`` URL

    Returns:
        str:
            The corresponding ``ws(s)`` URL ending in ``/ws``

    Raises:
        ValueError:
            If the input URL is not of the proper form.

    '''
    if url.startswith("http:"):
        reprotocoled = "ws" + url[4:]
    elif url.startswith("https:"):
        reprotocoled = "wss" + url[5:]
    else:
        raise ValueError("URL has unknown protocol " + url)
    if reprotocoled.endswith("/"):
        return reprotocoled + "ws"
    else:
        return reprotocoled + "/ws"

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
