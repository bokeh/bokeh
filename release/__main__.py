# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import sys

# Bokeh imports
from .config import Config
from .pipeline import Pipeline
from .stages import (
    BUILD_CHECKS,
    BUILD_STEPS,
    DEPLOY_CHECKS,
    DEPLOY_STEPS,
)
from .system import System

system = System()

if sys.argv[1] == "build":
    config = Config(sys.argv[2])

    check = Pipeline(BUILD_CHECKS, config, system)
    check.execute()

    steps = Pipeline(BUILD_STEPS, config, system)
    steps.execute()

    sys.exit(0)

if sys.argv[1] == "deploy":
    config = Config(sys.argv[2])

    check = Pipeline(DEPLOY_CHECKS, config, system)
    check.execute()

    steps = Pipeline(DEPLOY_STEPS, config, system)
    steps.execute()

    sys.exit(0)
