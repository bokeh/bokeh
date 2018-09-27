#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provides client API for connecting to a Bokeh server from a Python
process.

The primary uses for the ``bokeh.client`` are:

* Implementing testing infrastructure around Bokeh applications
* Creating and customizing specific sessions of a Bokeh application
  running *in a Bokeh Server*, before passing them to a viewer.

While it is also possible to run Bokeh application code "outside" a Bokeh
server using ``bokeh.client``, this practice is **HIGHLY DISCOURAGED**.

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

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# __all__ defined at the bottom on the class module

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

from .session import ClientSession
from .session import DEFAULT_SESSION_ID
from .session import pull_session
from .session import push_session
from .session import show_session

__all__ = (
    'ClientSession',
    'DEFAULT_SESSION_ID',
    'pull_session',
    'push_session',
    'show_session',
)
