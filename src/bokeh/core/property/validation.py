#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Configure property validation defaults and context-local overrides. """

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from functools import wraps
from types import TracebackType
from typing import Callable

from . import bases

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'set_validation_default',
    'validate',
    'without_property_validation',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def set_validation_default(value: bool) -> None:
    """ Set the process-wide default for property validation.

    This default applies to all threads and asyncio tasks without an explicit
    :class:`validate` override, including contexts created before this call.
    Active overrides take precedence. Changing the default during an override
    does not affect that override; the new default applies once no enclosing
    override remains.

    Args:
        value (bool) : Whether property validation is enabled by default.

    Raises:
        TypeError : If ``value`` is not a boolean.

    """
    if not isinstance(value, bool):
        raise TypeError("validation default must be a bool")
    bases._validation_default = value

class validate:
    """ Control validation of bokeh properties

    This can be used as a context manager, or as a normal callable.
    The override takes precedence over :func:`set_validation_default` and is
    local to the current execution context. New asyncio tasks and
    ``asyncio.to_thread`` inherit it. ``loop.run_in_executor`` and user-managed
    ``ThreadPoolExecutor`` calls do not copy the caller's context.
    ``threading.Thread`` follows Python's thread-context configuration; do not
    assume inheritance. Use ``contextvars.copy_context().run`` when explicit
    propagation is required.

    A bare ``validate(False)`` in a server application's initialization code
    does not disable validation for later callbacks in separate contexts. Use
    this context manager inside callbacks, decorate synchronous callbacks with
    :func:`without_property_validation`, or use :func:`set_validation_default`
    to configure all contexts without an override.

    Create a fresh instance for each scope and exit it in the same context where
    it was constructed. Instances are single-use and cannot be reentered.

    Args:
        value (bool) : Whether validation should occur or not

    Example:
        .. code-block:: python

            with validate(False):  # do not validate within this block
                pass

            validate(False)  # disable validation in this execution context

    See Also:
        :func:`~bokeh.core.property.bases.validation_on`: check the state of validation

        :func:`~bokeh.core.properties.without_property_validation`: function decorator

        :func:`~bokeh.core.properties.set_validation_default`: process-wide default

    """
    def __init__(self, value: bool) -> None:
        self._token = bases._validation_override.set(value)

    def __enter__(self) -> None:
        pass

    def __exit__(self, typ: type[BaseException] | None, value: BaseException | None, traceback: TracebackType | None) -> None:
        bases._validation_override.reset(self._token)


def without_property_validation[**P, R](input_function: Callable[P, R]) -> Callable[P, R]:
    """ Turn off property validation during synchronous update callbacks.

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
