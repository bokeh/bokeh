#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide useful aliases of groups of types.

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
import datetime

# Bokeh imports
from ..types import FactorType
from .datetime import Datetime
from .either import Either
from .factors import Factor
from .primitive import Float

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "CoordinateLike",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

type CoordinateLikeType = float | datetime.date | datetime.datetime | FactorType

CoordinateLike: Either[CoordinateLikeType] = Either(Float, Datetime, Factor)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
