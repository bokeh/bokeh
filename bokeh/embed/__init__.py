#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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

from .server import server_document
from .server import server_session

from .standalone import autoload_static
from .standalone import components
from .standalone import file_html
from .standalone import json_item

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
