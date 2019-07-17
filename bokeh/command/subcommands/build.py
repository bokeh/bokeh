#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
from os.path import join

# External imports

# Bokeh imports
from bokeh.settings import settings
from bokeh.util.compiler import _run_nodejs

from ..subcommand import Subcommand

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Build',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Build(Subcommand):
    '''

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
    )

    def invoke(self, args):
        bokehjs_dir = settings.bokehjsdir()
        print(bokehjs_dir)
        compiler_script = join(bokehjs_dir, "js", "compiler.js")
        output = _run_nodejs([compiler_script, "build", "--base-dir", args.base_dir, "--bokehjs-dir", bokehjs_dir])
        print(output)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
