#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2024, Anaconda, Inc., and Bokeh Contributors.
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
from typing import TYPE_CHECKING, Any, ClassVar

if TYPE_CHECKING:
    # External imports
    from typing_extensions import Self

# Bokeh imports
from ...core.has_props import abstract
from ...core.properties import (
    Dict,
    Float,
    List,
    Nullable,
    Override,
    Required,
    String,
    Tuple,
)
from ...model import Model
from ...util.dataclasses import dataclass

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Angular",
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

    basis = Required(Dict(String, Tuple(Float, String)), help="""
    TODO
    """)

    ticks = Required(List(Float), help="""
    Preferred values to choose from in non-exact mode.
    """)

    include = Nullable(List(String), default=None, help="""
    An optional subset of preferred units from the basis.
    """)

    exclude = List(String, default=[], help="""
    A subset of units from the basis to avoid.
    """)

@dataclass
class BasisItem:
    prefix: str
    factor: float
    tex_prefix: str | None = None

class Metric(Dimensional):
    """ Model for defining metric units of measurement.
    """

    _basis: ClassVar = [
        BasisItem("Q", 1e30),
        BasisItem("R", 1e27),
        BasisItem("Y", 1e24),
        BasisItem("Z", 1e21),
        BasisItem("E", 1e18),
        BasisItem("P", 1e15),
        BasisItem("T", 1e12),
        BasisItem("G", 1e9),
        BasisItem("M", 1e6),
        BasisItem("k", 1e3),
        BasisItem("h", 1e2),
        BasisItem("" , 1e0),
        BasisItem("d", 1e-1),
        BasisItem("c", 1e-2),
        BasisItem("m", 1e-3),
        BasisItem("µ", 1e-6, "\\mathrm{\\mu}"),
        BasisItem("n", 1e-9),
        BasisItem("p", 1e-12),
        BasisItem("f", 1e-15),
        BasisItem("a", 1e-18),
        BasisItem("z", 1e-21),
        BasisItem("y", 1e-24),
        BasisItem("r", 1e-27),
        BasisItem("q", 1e-30),
    ]

    @classmethod
    def _map_basis_item(cls: type[Self], name: str, factor: float, tex_name: str):
        return name, factor, tex_name

    def __init__(self, base_unit: str, **kwargs: Any) -> None:
        basis = {}
        for item in self._basis:
            name = f"{item.prefix}{base_unit}"
            factor = item.factor
            tex_name = f"{item.tex_prefix}{base_unit}" if item.tex_prefix is not None else name

            name, factor, tex_name = self._map_basis_item(name, factor, tex_name)
            basis[name] = (factor, tex_name)

        super().__init__(basis=basis, **kwargs)

    ticks = Override(default=[1, 2, 5, 10, 15, 20, 25, 50, 75, 100, 125, 150, 200, 250, 500, 750])

class ReciprocalMetric(Metric):
    """ Model for defining metric units of measurement.
    """

    @classmethod
    def _map_basis_item(cls: type[Self], name: str, factor: float, tex_name: str):
        return f"{name}⁻1", factor**-1, f"{tex_name}^{{-1}}"

    # explicit __init__ to support Init signatures
    def __init__(self, base_unit: str, **kwargs: Any) -> None:
        super().__init__(base_unit, **kwargs)

class MetricLength(Metric):
    """ Metric units of length measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__("m", **kwargs)

    exclude = Override(default=["dm", "hm"])

class ReciprocalMetricLength(ReciprocalMetric):
    """ Metric units of reciprocal length measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__("m", **kwargs)

    exclude = Override(default=["dm", "hm"])

class ImperialLength(Dimensional):
    """ Imperial units of length measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

    basis = Override(default={
        "in":  ( 1/12, "in" ),
        "ft":  (    1, "ft" ),
        "yd":  (    3, "yd" ),
        "ch":  (   66, "ch" ),
        "fur": (  660, "fur"),
        "mi":  ( 5280, "mi" ),
        "lea": (15840, "lea"),
    })

    ticks = Override(default=[1, 3, 6, 12, 60])

class Angular(Dimensional):
    """ Units of angular measurement.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

    basis = Override(default={
        "°":  (1,      "^\\circ"          ),
        "'":  (1/60,   "^\\prime"         ),
        "\"": (1/3600, "^{\\prime\\prime}"),
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
