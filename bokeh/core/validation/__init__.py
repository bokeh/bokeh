#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' The validation module provides the capability to perform integrity
checks on an entire collection of Bokeh models.

To create a Bokeh visualization, the central task is to assemble a collection
model objects from |bokeh.models| into a graph that represents the scene that
should be created in the client. It is possible to to this "by hand", using the
model objects directly. However, to make this process easier, Bokeh provides
higher level interfaces such as |bokeh.plotting| for users.

These interfaces automate common "assembly" steps, to ensure a Bokeh object
graph is created in a consistent, predictable way. However, regardless of what
interface is used, it is possible to put Bokeh models together in ways that are
incomplete, or that do not make sense in some way.

To assist with diagnosing potential problems, Bokeh performs a validation step
when outputting a visualization for display. This module contains error and
warning codes as well as helper functions for defining validation checks.

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
from .check import check_integrity
from .decorators import error, warning

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

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
