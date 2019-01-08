#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a version for the Bokeh library.

This module uses `versioneer`_ to manage version strings. During development,
`versioneer`_ will compute a version string from the current git revision.
For packaged releases based off tags, the version string is hard coded in the
files packaged for distribution.

Attributes:
    __version__:
        The full version string for this installed Bokeh library

Functions:
    base_version:
        Return the base version string, without any "dev", "rc" or local build
        information appended.

.. _versioneer: https://github.com/warner/python-versioneer

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
    'base_version',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def base_version():
    return _base_version_helper(__version__)

def _base_version_helper(version):
    import re
    VERSION_PAT = re.compile(r"^(\d+\.\d+\.\d+)((?:dev|rc).*)?")
    return VERSION_PAT.search(version).group(1)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

from .._version import get_versions
__version__ = get_versions()['version']
del get_versions
