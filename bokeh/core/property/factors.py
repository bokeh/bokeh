#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from .container import Seq, Tuple
from .either import Either
from .nullable import NonNullable
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

class Factor(NonNullable):
    """ Represents a single categorical factor. """

    def __init__(self, default=Intrinsic, *, help=None, serialized=None, readonly=False) -> None:
        type_param = Either(L1Factor, L2Factor, L3Factor)
        super().__init__(type_param, default=default, help=help, serialized=serialized, readonly=readonly)

class FactorSeq(NonNullable):
    """ Represents a collection of categorical factors. """

    def __init__(self, default=Intrinsic, *, help=None, serialized=None, readonly=False) -> None:
        type_param = Either(Seq(L1Factor), Seq(L2Factor), Seq(L3Factor))
        super().__init__(type_param, default=default, help=help, serialized=serialized, readonly=readonly)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
