#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
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

One use case for warnings is to loudly point users in the right direction
when they accidentally do something that they probably didn't mean to do - this
is the case for EMPTY_LAYOUT for instance. Since warnings don't necessarily
indicate misuse, they are configurable. To silence a warning, use the silence
function provided.

.. code-block:: python

    >>> from bokeh.core.validation import silence
    >>> from bokeh.core.validation.warnings import EMPTY_LAYOUT
    >>> silence(EMPTY_LAYOUT, True)

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
from .check import check_integrity, silence, silenced
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
