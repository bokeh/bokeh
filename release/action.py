# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""

# Standard library imports
from typing import Callable, Optional, Sequence

# Bokeh imports
from .enums import ActionResult
from .ui import failed, passed, skipped

UIResultFuncType = Callable[[str, Optional[Sequence[str]]], str]


class ActionReturn:
    """

    """

    kind: ActionResult
    ui: UIResultFuncType

    def __init__(self, message: str, details: Optional[Sequence[str]] = None) -> None:
        self.message = message
        self.details = details

    def __str__(self) -> str:
        return self.__class__.ui(self.message, self.details)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}({self.message!r}, details=...)"


class FAILED(ActionReturn):
    """

    """

    kind = ActionResult.FAIL
    ui = failed


class PASSED(ActionReturn):
    """

    """

    kind = ActionResult.PASS
    ui = passed


class SKIPPED(ActionReturn):
    """

    """

    kind = ActionResult.SKIP
    ui = skipped
