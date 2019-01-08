#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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

# Standard library imports

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ClientSession',
    'DEFAULT_SESSION_ID',
    'pull_session',
    'push_session',
    'show_session',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

from .session import ClientSession
from .session import DEFAULT_SESSION_ID
from .session import pull_session
from .session import push_session
from .session import show_session

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
