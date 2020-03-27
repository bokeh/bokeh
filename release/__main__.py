# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
import sys

# Bokeh imports
from .config import Config
from .stages import BUILD_CHECKS, BUILD_STEPS
from .ui import banner, blue

config = Config(sys.argv[1])

banner(blue, "{:^80}".format("Starting a Bokeh release BUILD"))

for step in BUILD_CHECKS:
    step(config)

for step in BUILD_STEPS:
    step(config)

banner(blue, "{:^80}".format(f"Bokeh {config.version!r} BUILD: SUCCESS"))
