#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the Instance property.

The Instance property is used to construct object graphs of Bokeh models,
where one Bokeh model refers to another.

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
from functools import wraps

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

    This can be used as a context manager, or as a normal callable

    Args:
        value (bool) : Whether validation should occur or not

    Example:
        .. code-block:: python

            with validate(False):  # do no validate while within this block
                pass

            validate(False)  # don't validate ever

    See Also:
        :func:`~bokeh.core.property.bases.validation_on`: check the state of validation

        :func:`~bokeh.core.properties.without_property_validation`: function decorator

    """
    def __init__(self, value) -> None:
        self.old = Property._should_validate
        Property._should_validate = value

    def __enter__(self):
        pass

    def __exit__(self, typ, value, traceback):
        Property._should_validate = self.old


def without_property_validation(input_function):
    """ Turn off property validation during update callbacks

    Example:
        .. code-block:: python

            @without_property_validation
            def update(attr, old, new):
                # do things without validation

    See Also:
        :class:`~bokeh.core.properties.validate`: context mangager for more fine-grained control

    """
    @wraps(input_function)
    def func(*args, **kwargs):
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
