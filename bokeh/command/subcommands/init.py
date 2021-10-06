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
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from argparse import Namespace

# Bokeh imports
from bokeh.ext import init

# Bokeh imports
from ..subcommand import Argument, Subcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = ("Init",)

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
        ("base_dir", Argument(
            metavar="BASE_DIR",
            type=str,
            nargs="?",
            default=".",
        )),
        ("--interactive", Argument(
            action="store_true",
            help="Walk the user through creating an extension",
        )),
        ("--bokehjs_version", Argument(
            action="store_true",
            help="Use a specific version of bokehjs",
        )),
        ("--debug", Argument(
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
