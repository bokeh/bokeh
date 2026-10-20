#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Control property validation in the current execution context. """

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
from functools import wraps
from types import TracebackType
from typing import Callable

# Bokeh imports
from .bases import Property

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'validate',
    'without_property_validation',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class validate:
    """ Control validation of bokeh properties

    This can be used as a context manager, or as a normal callable.
    The setting is local to the current thread and asyncio task. Worker threads
    started with ``asyncio.to_thread`` inherit the caller's setting.

    Args:
        value (bool) : Whether validation should occur or not

    Example:
        .. code-block:: python

            with validate(False):  # do no validate while within this block
                pass

            validate(False)  # disable validation in this execution context

    See Also:
        :func:`~bokeh.core.property.bases.validation_on`: check the state of validation

        :func:`~bokeh.core.properties.without_property_validation`: function decorator

    """
    def __init__(self, value: bool) -> None:
        self._token = Property._should_validate.set(value)

    def __enter__(self) -> None:
        pass

    def __exit__(self, typ: type[BaseException] | None, value: BaseException | None, traceback: TracebackType | None) -> None:
        Property._should_validate.reset(self._token)


def without_property_validation[**P, R](input_function: Callable[P, R]) -> Callable[P, R]:
    """ Turn off property validation during update callbacks

    Example:
        .. code-block:: python

            @without_property_validation
            def update(attr, old, new):
                # do things without validation

    See Also:
        :class:`~bokeh.core.properties.validate`: context manager for more fine-grained control

    """
    @wraps(input_function)
    def func(*args: P.args, **kwargs: P.kwargs) -> R:
        with validate(False):
            return input_function(*args, **kwargs)
    return func

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
