# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import sys

# Bokeh imports
from . import stages
from .config import Config
from .pipeline import Pipeline
from .system import System
from .util import load_config, save_config

system = System()

stage_generators = {
    "generate-build-checks": stages.BUILD_CHECKS,
    "generate-build-steps": stages.BUILD_STEPS,
    "generate-deploy-checks": stages.DEPLOY_CHECKS,
    "generate-deploy-steps": stages.DEPLOY_STEPS,
}

if len(sys.argv) == 3 and sys.argv[1] == "generate-config":
    config = Config(sys.argv[2])
    save_config(config)
    sys.exit(0)

if len(sys.argv) == 2 and sys.argv[1] in stage_generators:
    print([func.__name__ for func in stage_generators[sys.argv[1]]])
    sys.exit(0)

if len(sys.argv) == 2 and sys.argv[1] in dir(stages):
    config = load_config()

    func = getattr(stages, sys.argv[1])

    pipe = Pipeline([func], config, system)
    pipe.execute()

    save_config(config)

    sys.exit(0)

if len(sys.argv) == 3 and sys.argv[1] == "build":
    config = Config(sys.argv[2])

    check = Pipeline(stages.BUILD_CHECKS, config, system)
    check.execute()

    steps = Pipeline(stages.BUILD_STEPS, config, system)
    steps.execute()

    sys.exit(0)

if len(sys.argv) == 3 and sys.argv[1] == "deploy":
    config = Config(sys.argv[2])

    check = Pipeline(stages.DEPLOY_CHECKS, config, system)
    check.execute()

    steps = Pipeline(stages.DEPLOY_STEPS, config, system)
    steps.execute()

    sys.exit(0)

raise RuntimeError(f"Unrecognized args: {sys.argv[1:]}")
