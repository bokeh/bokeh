#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide ``Factor`` and ``FactorSeq`` properties. """

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

# Bokeh imports
from ..types import FactorSeqType, FactorType
from .bases import Init, SingleParameterizedProperty
from .container import Seq, Tuple
from .either import Either
from .primitive import String
from .singletons import Intrinsic

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Factor",
    "FactorSeq",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

L1Factor = String
L2Factor = Tuple(String, String)
L3Factor = Tuple(String, String, String)

class Factor(SingleParameterizedProperty[FactorType]):
    """ Represents a single categorical factor. """

    def __init__(self, default: Init[FactorType] = Intrinsic, *, help: str | None = None) -> None:
        type_param = Either(L1Factor, L2Factor, L3Factor)
        super().__init__(type_param, default=default, help=help)

class FactorSeq(SingleParameterizedProperty[FactorSeqType]):
    """ Represents a collection of categorical factors. """

    def __init__(self, default: Init[FactorSeqType] = Intrinsic, *, help: str | None = None) -> None:
        type_param = Either(Seq(L1Factor), Seq(L2Factor), Seq(L3Factor))
        super().__init__(type_param, default=default, help=help)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
