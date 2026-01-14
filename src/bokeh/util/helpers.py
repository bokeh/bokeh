#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various functions missing from the standard library.

"""

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------


# Standard library imports
from functools import reduce
from typing import Callable, Iterable, TypeVar

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "flatten",
)

T = TypeVar("T")
U = TypeVar("U")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def flatten(array: Iterable[list[T]]) -> list[T]:
    """ Combine a list of lists into a single list.
    """
    return reduce(list.__add__, array, [])

def flat_map(fn: Callable[[T], list[U]], array: list[T]) -> list[U]:
    """ Combine results of a list producing function into a single list.
    """
    return flatten(map(fn, array))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
