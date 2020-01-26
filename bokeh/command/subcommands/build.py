#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from argparse import Namespace

# Bokeh imports
from bokeh.ext import build

# Bokeh imports
from ..subcommand import Subcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ['Build']

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Build(Subcommand):
    '''
    Build a bokeh extension in the given directory.
    '''

    name = "build"

    help = "Manage and build a bokeh extension"

    args = (
        ("base_dir", dict(
            metavar="BASE_DIR",
            type=str,
            nargs="?",
            default=".",
        )),
        ("--rebuild", dict(
            action="store_true",
            help="Ignore all caches and perform a full rebuild",
        )),
        ("--debug", dict(
            action="store_true",
            help="Run nodejs in debug mode (use --inspect-brk)",
        )),
    )

    def invoke(self, args: Namespace) -> bool:
        return build(args.base_dir, rebuild=args.rebuild, debug=args.debug)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
