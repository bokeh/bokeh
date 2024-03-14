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
from typing import Callable, Sequence, TypeAlias

# Bokeh imports
from .enums import ActionResult
from .ui import failed, passed, skipped

UIResultFuncType: TypeAlias = Callable[[str, Sequence[str] | None], str]

class ActionReturn:
    """"""

    kind: ActionResult
    ui: UIResultFuncType

    def __init__(self, message: str, details: Sequence[str] | None = None) -> None:
        self.message = message
        self.details = details

    def __str__(self) -> str:
        return self.__class__.ui(self.message, self.details)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}({self.message!r}, details=...)"


class FAILED(ActionReturn):
    """"""

    kind = ActionResult.FAIL
    ui = failed


class PASSED(ActionReturn):
    """"""

    kind = ActionResult.PASS
    ui = passed


class SKIPPED(ActionReturn):
    """"""

    kind = ActionResult.SKIP
    ui = skipped
