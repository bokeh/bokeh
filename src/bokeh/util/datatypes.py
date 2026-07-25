#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from collections.abc import (
    Iterable,
    Mapping,
    Set,
    Sized,
)
from typing import (
    Generic,
    Protocol,
    TypeGuard,
    TypeVar,
    cast,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'MultiValuedDict',
    'SequenceLike',
    'is_SequenceLike',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

K = TypeVar("K")
T = TypeVar("T", covariant=True)
V = TypeVar("V")

class SequenceLike(Iterable[T], Sized, Protocol):
    """A sized iterable with a stable iteration order."""

def is_SequenceLike(obj: object) -> TypeGuard[SequenceLike[object]]:
    """Whether an object is a sized, ordered iterable."""
    return (
        isinstance(obj, Iterable)
        and isinstance(obj, Sized)
        and not isinstance(obj, (str, bytes, Mapping, Set))
    )

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
            cast(set[V], existing).add(value) # XXX: V does not exclude `set[_]`
        else:
            self._dict[key] = {existing, value}

    def get_all(self, k: K) -> list[V]:
        '''

        '''
        existing = self._dict.get(k)
        if existing is None:
            return []
        elif isinstance(existing, set):
            return list(cast(set[V], existing))
        else:
            return [existing]

    def get_one(self, k: K, duplicate_error: str) -> V | None:
        '''

        '''
        existing = self._dict.get(k)
        if isinstance(existing, set):
            existing = cast(set[V], existing)
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
            existing = cast(set[V], existing)
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
