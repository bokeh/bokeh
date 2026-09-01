# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import logging
import sys

# Bokeh imports
from . import stages
from .config import Config
from .pipeline import Pipeline
from .system import System

logging.basicConfig(format="%(message)s", stream=sys.stdout, force=True)
logging.getLogger("release").setLevel(logging.INFO)

system = System()

if len(sys.argv) == 3 and sys.argv[1] == "build-artifacts":
    config = Config(sys.argv[2])

    check = Pipeline(stages.BUILD_CHECKS, config, system)
    check.execute()

    steps = Pipeline(stages.BUILD_ARTIFACT_STEPS, config, system)
    steps.execute()

    sys.exit(0)

if len(sys.argv) == 3 and sys.argv[1] == "upload-deployment":
    config = Config(sys.argv[2])

    steps = Pipeline(stages.UPLOAD_DEPLOYMENT_STEPS, config, system)
    steps.execute()

    sys.exit(0)

if len(sys.argv) == 3 and sys.argv[1] == "update-release-repository":
    config = Config(sys.argv[2])

    steps = Pipeline(stages.UPDATE_RELEASE_REPOSITORY_STEPS, config, system)
    steps.execute()

    sys.exit(0)

if len(sys.argv) == 3 and sys.argv[1] == "prepare-deployment":
    config = Config(sys.argv[2])

    check = Pipeline(stages.PREPARE_DEPLOYMENT_CHECKS, config, system)
    check.execute()

    steps = Pipeline(stages.PREPARE_DEPLOYMENT_STEPS, config, system)
    steps.execute()

    sys.exit(0)

if len(sys.argv) == 3 and sys.argv[1] == "publish-docs":
    config = Config(sys.argv[2])

    steps = Pipeline(stages.DOCS_STEPS, config, system)
    steps.execute()

    sys.exit(0)

raise RuntimeError(f"Unrecognized args: {sys.argv[1:]}")
