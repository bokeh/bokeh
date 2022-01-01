# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""
from __future__ import annotations

# Bokeh imports
from .pipeline import StepType

__all__ = ("skip_for_prerelease",)


def skip_for_prerelease(func: StepType) -> StepType:
    func.skip_for_prerelease = True  # type: ignore
    return func
