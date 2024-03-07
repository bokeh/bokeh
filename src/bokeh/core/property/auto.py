#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the Auto property.

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

# Bokeh imports
from .enum import Enum

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Auto',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Auto(Enum):
    """ Accepts only the string "auto".

    Useful for properties that can be configured to behave "automatically".

    Example:

        This property is often most useful in conjunction with the
        :class:`~bokeh.core.properties.Either` property.

        .. code-block:: python

            >>> class AutoModel(HasProps):
            ...     prop = Either(Float, Auto)
            ...

            >>> m = AutoModel()

            >>> m.prop = 10.2

            >>> m.prop = "auto"

            >>> m.prop = "foo"      # ValueError !!

            >>> m.prop = [1, 2, 3]  # ValueError !!

    """
    def __init__(self) -> None:
        super().__init__("auto")

    def __str__(self) -> str:
        return self.__class__.__name__

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
