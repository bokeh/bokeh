#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define a Pytest plugin to make all unmarked tests have an implicit mark.

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
from _pytest.mark import matchmark # TODO (bev) non-private API?

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'pytest_addoption',
    'pytest_collection_modifyitems',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def pytest_addoption(parser):
    parser.addini("implicit_marker",
                  "An implicit marker to assign to any test otherwise unmarked")

def pytest_collection_modifyitems(items, config):
    implicit_marker = config.getini("implicit_marker")
    if not implicit_marker:
        return

    markers = []
    for line in config.getini("markers"):
        mark, rest = line.split(":", 1)
        if '(' in mark:
            mark, rest = mark.split("(", 1)
        markers.append(mark)

    all_markers = ' or '.join(markers)
    if not all_markers:
        return

    for item in items:
        if not matchmark(item, all_markers):
            item.add_marker(implicit_marker)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
