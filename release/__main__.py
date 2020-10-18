# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

import sys

from .config import Config
from .pipeline import Pipeline
from .stages import BUILD_CHECKS, BUILD_STEPS, DEPLOY_CHECKS
from .system import System

system = System()

if sys.argv[1] == "build":
    config = Config(sys.argv[2])

    check = Pipeline(BUILD_CHECKS, config, system)
    check.execute()

    build = Pipeline(BUILD_STEPS, config, system)
    build.execute()

    sys.exit(0)

if sys.argv[1] == "deploy":
    config = Config(sys.argv[2])

    check = Pipeline(DEPLOY_CHECKS, config, system)
    check.execute()

    sys.exit(0)
