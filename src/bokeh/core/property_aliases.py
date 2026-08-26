#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Reusable common property type aliases.

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
from typing import Literal, NotRequired, TypedDict

# Bokeh imports
from . import enums
from .property.auto import Auto
from .property.container import Dict, List, Tuple
from .property.either import Either
from .property.enum import Enum
from .property.numeric import Int, NonNegative, Percent
from .property.string import Regex, String
from .property.struct import Optional, Struct
from .property.visual import Image

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Anchor",
    "AutoAnchor",
    "BorderRadius",
    "CSSClass",
    "CSSVariable",
    "DataImage",
    "GridSpacing",
    "IconLike",
    "Padding",
    "Pixels",
    "TextAnchor",
    "TracksSizing",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

type AutoType = Literal["auto"]
type PercentType = float

CSSVariable = Regex(r"^--")

CSSClass = Regex(r"^\.")

DataImage = Regex(r"^\data:image")

IconLike = Either(Image, Enum(enums.ToolIcon), CSSVariable, CSSClass, DataImage)

type PixelsType = int
Pixels = NonNegative(Int)

type HAnchorType = enums.AlignType | enums.HAlignType | PercentType
HAnchor = Either(Enum(enums.Align), Enum(enums.HAlign), Percent)

type VAnchorType = enums.AlignType | enums.VAlignType | PercentType
VAnchor = Either(Enum(enums.Align), Enum(enums.VAlign), Percent)

Anchor = (
    Either(
        Enum(enums.Anchor),
        Tuple(HAnchor, VAnchor),
    )
)

type AutoAnchorType = AutoType | enums.AnchorType | tuple[AutoType | HAnchorType, AutoType | VAnchorType]
AutoAnchor = (
    Either(
        Auto,
        Enum(enums.Anchor),
        Tuple(Either(Auto, HAnchor), Either(Auto, VAnchor)),
    )
)

TextAnchor = Either(Anchor, Auto)

class XYType[T](TypedDict):
    x: NotRequired[T]
    y: NotRequired[T]

class LRTBType[T](TypedDict):
    left: NotRequired[T]
    right: NotRequired[T]
    top: NotRequired[T]
    bottom: NotRequired[T]

class CornersType[T](TypedDict):
    top_left: NotRequired[T]
    top_right: NotRequired[T]
    bottom_right: NotRequired[T]
    bottom_left: NotRequired[T]

type BorderRadiusType = (
    PixelsType |
    tuple[PixelsType, PixelsType, PixelsType, PixelsType] |
    CornersType[PixelsType]
)
BorderRadius = (
    Either(
        Pixels,
        Tuple(Pixels, Pixels, Pixels, Pixels),
        Struct(
            top_left=Optional(Pixels),
            top_right=Optional(Pixels),
            bottom_right=Optional(Pixels),
            bottom_left=Optional(Pixels),
        ),
    )
)

type PaddingType = (
    PixelsType |
    tuple[PixelsType, PixelsType] |
    tuple[PixelsType, PixelsType, PixelsType, PixelsType] |
    XYType[PixelsType] |
    LRTBType[PixelsType]
)
Padding = (
    Either(
        Pixels,
        Tuple(Pixels, Pixels),
        Struct(
            x=Optional(Pixels),
            y=Optional(Pixels),
        ),
        Tuple(Pixels, Pixels, Pixels, Pixels),
        Struct(
            left=Optional(Pixels),
            right=Optional(Pixels),
            top=Optional(Pixels),
            bottom=Optional(Pixels),
        ),
    )
)

GridSpacing = Either(Pixels, Tuple(Pixels, Pixels))

TrackAlign = Enum("start", "center", "end", "auto")

# CSS length, percentage, flex, max-content, min-content, auto, etc.
# See https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns.
TrackSize = String()

TrackSizing = Either(TrackSize, Struct(size=Optional(TrackSize), align=Optional(TrackAlign)))

TracksSizing = Either(TrackSizing, List(TrackSizing), Dict(Int, TrackSizing))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
