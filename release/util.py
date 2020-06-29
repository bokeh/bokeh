# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------
"""

"""

# Standard library imports
from typing import Callable

__all__ = ("skip_for_prerelease",)


def skip_for_prerelease(func: Callable) -> Callable:
    func.skip_for_prerelease = True  # type: ignore
    return func
