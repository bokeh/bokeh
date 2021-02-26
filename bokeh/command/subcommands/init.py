#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from bokeh.ext import init

# Bokeh imports
from ..subcommand import Subcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ['Init']

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Init(Subcommand):
    '''
    Initialize a directory as a new bokeh extension.
    '''

    name = "init"

    help = "Initialize a bokeh extension"

    args = (
        ("base_dir", dict(
            metavar="BASE_DIR",
            type=str,
            nargs="?",
            default=".",
        )),
        ("--interactive", dict(
            action="store_true",
            help="Walk the user through creating an extension",
        )),
        ("--bokehjs_version", dict(
            action="store_true",
            help="Use a specific version of bokehjs",
        )),
        ("--debug", dict(
            action="store_true",
            help="Run nodejs in debug mode (use --inspect-brk)",
        )),
    )

    def invoke(self, args: Namespace) -> bool:
        return init(args.base_dir, interactive=args.interactive,
                    bokehjs_version=args.bokehjs_version, debug=args.debug)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
