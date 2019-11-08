#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Subcommands for the Bokeh command class

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import List, Type, TYPE_CHECKING

# External imports
# necessary workaround to perform import only when running mypy typechecking
# see https://mypy.readthedocs.io/en/latest/common_issues.html#import-cycles
if TYPE_CHECKING:
    from ..subcommand import Subcommand


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

def _collect() -> List[Type[Subcommand]]:
    from importlib import import_module
    from os import listdir
    from os.path import dirname
    from ..subcommand import Subcommand
    # reference type by module as fully
    results = []

    for file in listdir(dirname(__file__)):

        if not file.endswith(".py") or file in ("__init__.py", "__main__.py"):
            continue

        modname = file.rstrip(".py")
        mod = import_module("." + modname, __package__)

        for name in dir(mod):
            attr = getattr(mod, name)
            if isinstance(attr, type) and issubclass(attr, Subcommand):
                # TODO - typing added empty string "name" attribute to Subcommand, below check may now fail
                # could instead use below commented if-check
                # if attr: continue  # use truthy value of non-empty string
                if not hasattr(attr, 'name'): continue # excludes abstract bases
                results.append(attr)

    results = sorted(results, key=lambda attr: attr.name)

    return results

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

all = _collect()

del _collect
