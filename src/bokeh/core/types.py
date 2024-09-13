#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provides additional core types based on ``typing`` and ``typing_extensions``.

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
import os
from typing import (
    Literal,
    NewType,
    Sequence,
    TypeAlias,
    TypedDict,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "ID",
    "PathLike",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

ID = NewType("ID", str)

PathLike: TypeAlias = str | os.PathLike[str]

FactorType: TypeAlias = str | tuple[str, str] | tuple[str, str, str]
FactorSeqType: TypeAlias = Sequence[str] | Sequence[tuple[str, str]] | Sequence[tuple[str, str, str]]


# TODO: move this to types/geometry.py
class PointGeometry(TypedDict):
    type: Literal["point"]
    sx: float
    sy: float

class SpanGeometry(TypedDict):
    type: Literal["span"]
    direction: Literal["h", "v"]
    sx: float
    sy: float

class RectGeometry(TypedDict):
    type: Literal["rect"]
    sx0: float
    sx1: float
    sy0: float
    sy1: float

class PolyGeometry(TypedDict):
    type: Literal["poly"]
    sx: Sequence[float]
    sy: Sequence[float]

Geometry: TypeAlias = PointGeometry | SpanGeometry | RectGeometry | PolyGeometry

class PointGeometryData(PointGeometry):
    x: float
    y: float

class SpanGeometryData(SpanGeometry):
    x: float
    y: float

class RectGeometryData(RectGeometry):
    x0: float
    x1: float
    y0: float
    y1: float

class PolyGeometryData(PolyGeometry):
    x: Sequence[float]
    y: Sequence[float]

GeometryData: TypeAlias = PointGeometryData | SpanGeometryData | RectGeometryData | PolyGeometryData

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
