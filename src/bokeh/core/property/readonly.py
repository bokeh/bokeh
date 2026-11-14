#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide readonly properties. """

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from typing import Any, Never, cast

from .bases import (
    Init,
    Property,
    SingleParameterizedProperty,
    TypeOrInst,
)
from .singletons import Undefined

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Readonly",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Readonly[G](SingleParameterizedProperty[G, Never]):
    """ A property that can't be manually modified by the user. """

    _readonly = True

    def __init__(self, type_param: TypeOrInst[Property[G, Any]], *, default: Init[G] = Undefined, help: str | None = None) -> None:
        # Readonly properties can't be assigned (``S`` is ``Never``), but can have defaults.
        super().__init__(type_param, default=cast(Init[Never], default), help=help)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
