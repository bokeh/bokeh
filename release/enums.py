# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# Standard library imports
from enum import Enum

__all__ = (
    "ActionStatus",
    "StepStatus",
    "VersionType",
)


class VersionType(Enum):
    FULL = "FULL RELEASE"
    DEV = "DEV BUILD"
    RC = "RELEASE CANDIDATE"


class StepStatus(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"


class ActionStatus(Enum):
    NOT_STARTED = "NOT STARTED"
    STARTED = "STARTED BUT NOT COMPLETED"
    COMPLETED = "COMPLETED"
