#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a set of decorators useful for repeatedly updating a
a function parameter in a specified way each time the function is
called.

These decorators can be especially useful in conjunction with periodic
callbacks in a Bokeh server application.

Example:

    As an example, consider the ``bounce`` forcing function, which
    advances a sequence forwards and backwards:

    .. code-block:: python

        from bokeh.driving import bounce

        @bounce([0, 1, 2])
        def update(i):
            print(i)

    If this function is repeatedly called, it will print the following
    sequence on standard out:

    .. code-block:: none

        0 1 2 2 1 0 0 1 2 2 1 ...

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
from functools import partial
from typing import (
    Any,
    Callable,
    Iterable,
    Iterator,
    Sequence,
    TypeVar,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'bounce',
    'cosine',
    'count',
    'force',
    'linear',
    'repeat',
    'sine',
)
#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def bounce(sequence: Sequence[int]) -> partial[Callable[[], None]]:
    ''' Return a driver function that can advance a "bounced" sequence
    of values.

    .. code-block:: none

        seq = [0, 1, 2, 3]

        # bounce(seq) => [0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, ...]

    Args:
        sequence (seq) : a sequence of values for the driver to bounce

    '''
    N = len(sequence)
    def f(i: int) -> int:
        div, mod = divmod(i, N)
        if div % 2 == 0:
            return sequence[mod]
        else:
            return sequence[N-mod-1]
    return partial(force, sequence=_advance(f))

def cosine(w: float, A: float = 1, phi: float = 0, offset: float = 0) -> partial[Callable[[], None]]:
    ''' Return a driver function that can advance a sequence of cosine values.

    .. code-block:: none

        value = A * cos(w*i + phi) + offset

    Args:
        w (float) : a frequency for the cosine driver
        A (float) : an amplitude for the cosine driver
        phi (float) : a phase offset to start the cosine driver with
        offset (float) : a global offset to add to the driver values

    '''
    from math import cos
    def f(i: float) -> float:
        return A * cos(w*i + phi) + offset
    return partial(force, sequence=_advance(f))

def count() -> partial[Callable[[], None]]:
    ''' Return a driver function that can advance a simple count.

    '''
    return partial(force, sequence=_advance(lambda x: x))

def force(f: Callable[[Any], None], sequence: Iterator[Any]) -> Callable[[], None]:
    ''' Return a decorator that can "force" a function with an arbitrary
    supplied generator

    Args:
        sequence (iterable) :
            generator to drive f with

    Returns:
        decorator

    '''
    def wrapper() -> None:
        f(next(sequence))
    return wrapper

def linear(m: float = 1, b: float = 0) -> partial[Callable[[], None]]:
    ''' Return a driver function that can advance a sequence of linear values.

    .. code-block:: none

        value = m * i + b

    Args:
        m (float) : a slope for the linear driver
        x (float) : an offset for the linear driver

    '''
    def f(i: float) -> float:
        return m * i + b
    return partial(force, sequence=_advance(f))

def repeat(sequence: Sequence[int]) -> partial[Callable[[], None]]:
    ''' Return a driver function that can advance a repeated of values.

    .. code-block:: none

        seq = [0, 1, 2, 3]

        # repeat(seq) => [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, ...]

    Args:
        sequence (seq) : a sequence of values for the driver to bounce

    '''
    N = len(sequence)
    def f(i: int) -> int:
        return sequence[i%N]
    return partial(force, sequence=_advance(f))

def sine(w: float, A: float = 1, phi: float = 0, offset: float = 0) -> partial[Callable[[], None]]:
    ''' Return a driver function that can advance a sequence of sine values.

    .. code-block:: none

        value = A * sin(w*i + phi) + offset

    Args:
        w (float) : a frequency for the sine driver
        A (float) : an amplitude for the sine driver
        phi (float) : a phase offset to start the sine driver with
        offset (float) : a global offset to add to the driver values

    '''
    from math import sin
    def f(i: float) -> float:
        return A * sin(w*i + phi) + offset
    return partial(force, sequence=_advance(f))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

T = TypeVar("T")

def _advance(f: Callable[[int], T]) -> Iterable[T]:
    ''' Yield a sequence generated by calling a given function with
    successively incremented integer values.

    Args:
        f (callable) :
            The function to advance

    Yields:
        f(i) where i increases each call

    '''
    i = 0
    while True:
        yield f(i)
        i += 1

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
