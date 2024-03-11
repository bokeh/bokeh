#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from abc import abstractmethod
from typing import Any

# Bokeh imports
from ...core.has_props import abstract
from ...core.properties import (
    Dict,
    Either,
    Float,
    List,
    Nullable,
    Override,
    Required,
    String,
    Tuple,
)
from ...model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Angular",
    "ImperialLength",
    "Metric",
    "MetricLength",
    "ReciprocalMetric",
    "ReciprocalMetricLength",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Dimensional(Model):
    """ A base class for models defining units of measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

    ticks = Required(List(Float), help="""
    Preferred values to choose from in non-exact mode.
    """)

    include = Nullable(List(String), default=None, help="""
    An optional subset of preferred units from the basis.
    """)

    exclude = List(String, default=[], help="""
    A subset of units from the basis to avoid.
    """)

    @abstractmethod
    def is_known(self, unit: str) -> bool:
        pass

class CustomDimensional(Dimensional):
    """ A base class for units of measurement with an explicit basis.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

    basis = Required(Dict(String, Either(Tuple(Float, String), Tuple(Float, String, String))), help="""
    The basis defining the units of measurement.

    This consists of a mapping between short unit names and their corresponding
    scaling factors, TeX names and optional long names. For example, the basis
    for defining angular units of measurement is:

    .. code-block:: python

        basis = {
            "°":  (1,      "^\\circ",           "degree"),
            "'":  (1/60,   "^\\prime",          "minute"),
            "''": (1/3600, "^{\\prime\\prime}", "second"),
        }
    """)

    def is_known(self, unit: str) -> bool:
        return unit in self.basis

class Metric(Dimensional):
    """ Model for defining metric units of measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

    base_unit = Required(String, help="""
    The short name of the base unit, e.g. ``"m"`` for meters or ``"eV"`` for electron volts.
    """)

    full_unit = Nullable(String, default=None, help="""
    The full name of the base unit, e.g. ``"meter"`` or ``"electronvolt"``.
    """)

    ticks = Override(default=[1, 2, 5, 10, 15, 20, 25, 50, 75, 100, 125, 150, 200, 250, 500, 750])

    def is_known(self, unit: str) -> bool:
        prefixes = ["Q", "R", "Y", "Z", "E", "P", "T", "G", "M", "k", "h", "", "d", "c", "m", "µ", "n", "p", "f", "a", "z", "y", "r", "q"]
        basis = {f"{prefix}{unit}" for prefix in prefixes}
        return unit in basis

class ReciprocalMetric(Metric):
    """ Model for defining reciprocal metric units of measurement, e.g. ``m^{-1}``.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

class MetricLength(Metric):
    """ Metric units of length measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

    base_unit = Override(default="m")

    exclude = Override(default=["dm", "hm"])

class ReciprocalMetricLength(ReciprocalMetric):
    """ Metric units of reciprocal length measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

    base_unit = Override(default="m")

    exclude = Override(default=["dm", "hm"])

class ImperialLength(CustomDimensional):
    """ Imperial units of length measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

    basis = Override(default={
        "in":  ( 1/12, "in",  "inch"   ),
        "ft":  (    1, "ft",  "foot"   ),
        "yd":  (    3, "yd",  "yard"   ),
        "ch":  (   66, "ch",  "chain"  ),
        "fur": (  660, "fur", "furlong"),
        "mi":  ( 5280, "mi",  "mile"   ),
        "lea": (15840, "lea", "league" ),
    })

    ticks = Override(default=[1, 3, 6, 12, 60])

class Angular(CustomDimensional):
    """ Units of angular measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

    basis = Override(default={
        "°":  (1,      "^\\circ",           "degree"),
        "'":  (1/60,   "^\\prime",          "minute"),
        "''": (1/3600, "^{\\prime\\prime}", "second"),
    })

    ticks = Override(default=[1, 3, 6, 12, 60, 120, 240, 360])

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
