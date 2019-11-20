#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide functions for embedding Bokeh standalone and server content in
web pages.

.. autofunction:: autoload_static
.. autofunction:: components
.. autofunction:: file_html
.. autofunction:: json_item
.. autofunction:: server_document
.. autofunction:: server_session

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from .server import server_document, server_session
from .standalone import autoload_static, components, file_html, json_item

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'autoload_static',
    'components',
    'file_html',
    'json_item',
    'server_document',
    'server_session',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------



#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
