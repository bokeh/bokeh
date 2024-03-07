#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Subcommands for the Bokeh command class

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..subcommand import Subcommand

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

def _collect() -> list[type[Subcommand]]:
    from importlib import import_module
    from os import listdir
    from os.path import dirname

    # reference type by module as fully
    results: list[type[Subcommand]] = []

    for file in listdir(dirname(__file__)):

        if not file.endswith(".py") or file in ("__init__.py", "__main__.py"):
            continue

        modname = file.rstrip(".py")
        mod = import_module("." + modname, __package__)

        for name in dir(mod):
            attr = getattr(mod, name)
            try:
                if isinstance(attr, type) and issubclass(attr, Subcommand):
                    if not getattr(attr, "name", None):
                        continue # instance attribute not defined on abstract base class
                    results.append(attr)
            except TypeError:
                # TypeAlias definition can raise in issubclass()
                pass

    results = sorted(results, key=lambda attr: attr.name)

    return results

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

all = _collect()

del _collect
