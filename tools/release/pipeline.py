# -----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""
from __future__ import annotations

# Standard library imports
import logging
from typing import Callable, Sequence

# Bokeh imports
from .action import SKIPPED, ActionResult, ActionReturn
from .config import Config
from .system import System
from .ui import task

__all__ = ("StepType",)

StepType = Callable[[Config, System], ActionReturn]

log = logging.getLogger(__name__)


def is_check(step: StepType) -> bool:
    return step.__name__.startswith("check_") or step.__name__.startswith("verify_")


class Pipeline:
    """"""

    def __init__(self, steps: Sequence[StepType], config: Config, system: System) -> None:
        self._steps = steps
        self._config = config
        self._system = system

    def execute(self) -> None:
        """"""
        for step in self._steps:

            log.info("%s", task(f"Starting task {step.__name__}"))

            if is_check(step) and self._system.dry_run:
                log.info("%s", SKIPPED(f"{step.__name__} skipped for dry run"))
                continue

            if self._config.prerelease and getattr(step, "skip_for_prerelease", False):
                log.info("%s", SKIPPED(f"{step.__name__} skipped for pre-releases"))
                continue

            result = step(self._config, self._system)

            log.info("%s", result)

            if result.kind is ActionResult.FAIL:
                self._system.abort()
