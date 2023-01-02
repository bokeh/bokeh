#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

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
from typing import (
    Generic,
    Set,
    TypeVar,
    cast,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'MultiValuedDict',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

K = TypeVar("K")
V = TypeVar("V")

class MultiValuedDict(Generic[K, V]):
    ''' Store a mapping from keys to multiple values with minimal overhead.

    Avoids storing empty collections.

    '''

    _dict: dict[K, V | set[V]]

    def __init__(self) -> None:
        '''

        '''
        self._dict = {}

    def add_value(self, key: K, value: V) -> None:
        '''

        '''
        if key is None:
            raise ValueError("Key is None")

        if value is None:
            raise ValueError("Can't put None in this dict")

        if isinstance(value, set):
            raise ValueError("Can't put sets in this dict")

        existing = self._dict.get(key)
        if existing is None:
            self._dict[key] = value
        elif isinstance(existing, set):
            cast(Set[V], existing).add(value) # XXX: V does not exclude `set[_]`
        else:
            self._dict[key] = {existing, value}

    def get_all(self, k: K) -> list[V]:
        '''

        '''
        existing = self._dict.get(k)
        if existing is None:
            return []
        elif isinstance(existing, set):
            return list(cast(Set[V], existing))
        else:
            return [existing]

    def get_one(self, k: K, duplicate_error: str) -> V | None:
        '''

        '''
        existing = self._dict.get(k)
        if isinstance(existing, set):
            existing = cast(Set[V], existing)
            if len(existing) == 1:
                return next(iter(existing))
            else:
                raise ValueError(f"{duplicate_error}: {existing!r}")
        else:
            return existing

    def remove_value(self, key: K, value: V) -> None:
        '''

        '''
        if key is None:
            raise ValueError("Key is None")

        existing = self._dict.get(key)
        if isinstance(existing, set):
            existing = cast(Set[V], existing)
            existing.discard(value)
            if len(existing) == 0:
                del self._dict[key]
        elif existing == value:
            del self._dict[key]

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
