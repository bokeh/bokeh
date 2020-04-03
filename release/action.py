# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
from abc import ABCMeta, abstractmethod
from typing import Optional, Sequence

# External imports
from packaging.version import Version as V

# Bokeh imports
from .config import Config
from .enums import ActionResult, ActionType


class ActionReturn(object):

    _result: ActionResult

    def __init__(self, message: str, details: Optional[Sequence[str]] = None) -> None:
        self.message = message
        self.details = details

    def __str__(self) -> str:
        return f"[{self._result.value}] {self.message}"

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}({self.message!r}, details=...)"


class FAILED(ActionReturn):
    _result: ActionResult = ActionResult.FAIL


class PASSED(ActionReturn):
    _result: ActionResult = ActionResult.PASS


class SKIPPED(ActionReturn):
    _result: ActionResult = ActionResult.SKIP


class action(metaclass=ABCMeta):

    _action_type: ActionType

    _skip_prerelease: bool = False

    _name: Optional[str] = None

    def __call__(self, config: Config) -> ActionReturn:

        if config.dry_run and self._action_type is ActionType.CHECK:
            return SKIPPED(f"{self.name} skipped for dry run")

        if self._skip_prerelease and V(config.version).is_prerelease:
            return SKIPPED(f"{self.name} skipped for pre-release")

        return self.execute(config)

    @property
    def name(self) -> str:
        return self._name or self.__class__.__name__

    @abstractmethod
    def execute(self, config: Config) -> ActionReturn:
        pass


class check(action):
    _action_type = ActionType.CHECK


class task(action):
    _action_type = ActionType.TASK
