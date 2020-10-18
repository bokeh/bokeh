# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Bokeh imports
from .action import FAILED, PASSED, ActionReturn
from .config import Config
from .system import System

__all__ = ("unpack_deployment_tarball",)


def unpack_deployment_tarball(config: Config, system: System) -> ActionReturn:
    try:
        filename = f"deployment-{config.version}.tgz"
        system.run(f"tar xvf {filename}")
        return PASSED(f"Unpacked deployment tarball {filename!r}")
    except RuntimeError as e:
        return FAILED("Could NOT unpack deployment tarball", details=e.args)
