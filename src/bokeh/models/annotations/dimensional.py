#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from typing import Any

# Bokeh imports
from ...core.has_props import abstract
from ...core.properties import (
    Float,
    List,
    Nullable,
    Override,
    String,
)
from ...model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "MetricLength",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Dimensional(Model):
    """
    A base class for models defining units of measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    ticks = List(Float, help="""
    Preferred values to choose from in non-exact mode.
    """)

    include = Nullable(List(String), default=None, help="""
    An optional subset of preferred units from the basis.
    """)

    exclude = List(String, default=[], help="""
    A subset of units from the basis to avoid.
    """)

@abstract
class Metric(Dimensional):
    """
    A base class defining metric units of measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    ticks = Override(default=[1, 2, 5, 10, 15, 20, 25, 50, 75, 100, 125, 150, 200, 250, 500, 750])

class MetricLength(Metric):
    """
    Units of metric length.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    exclude = Override(default=["dm", "hm"])

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
