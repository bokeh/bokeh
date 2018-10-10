#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Subcommands for the Bokeh command class

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
    'all',
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

def _collect():
    from importlib import import_module
    from os import listdir
    from os.path import dirname
    from ..subcommand import Subcommand

    results = []

    for file in listdir(dirname(__file__)):

        if not file.endswith(".py") or file in ("__init__.py", "__main__.py"):
            continue

        modname = file.rstrip(".py")
        mod = import_module("." + modname, __package__)

        for name in dir(mod):
            attr = getattr(mod, name)
            if isinstance(attr, type) and issubclass(attr, Subcommand):
                if not hasattr(attr, 'name'): continue # excludes abstract bases
                results.append(attr)

    results = sorted(results, key=lambda attr: attr.name)

    return results

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

all = _collect()

del _collect
