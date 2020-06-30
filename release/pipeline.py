# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""

# Standard library imports
from typing import Callable, Sequence

# Bokeh imports
from .action import SKIPPED, ActionResult, ActionReturn
from .config import Config
from .logger import LOG
from .system import System
from .ui import task

__all__ = ("StepType",)

StepType = Callable[[Config, System], ActionReturn]


def is_check(step: StepType) -> bool:
    return step.__name__.startswith("check_") or step.__name__.startswith("verify_")


class Pipeline:
    """

    """

    def __init__(self, steps: Sequence[StepType], config: Config, system: System):
        self._steps = steps
        self._config = config
        self._system = system

    def execute(self) -> None:
        """

        """
        LOG.clear()

        for step in self._steps:

            LOG.record(task(f"Starting task {step.__name__}"))

            if is_check(step) and self._system.dry_run:
                LOG.record(str(SKIPPED(f"{step.__name__} skipped for dry run")))
                continue

            if self._config.prerelease and getattr(step, "skip_for_prerelease", False):
                LOG.record(str(SKIPPED(f"{step.__name__} skipped for pre-releases")))
                continue

            result = step(self._config, self._system)

            LOG.record(str(result))

            if result.kind is ActionResult.FAIL:
                self._system.abort()
