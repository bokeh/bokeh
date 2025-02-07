#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Literal, NotRequired, TypedDict

# Bokeh imports
from .._types import Image, NonNegative
from ..core.enums import (
    AlignType as Align,
    AnchorType,
    AutoType as Auto,
    HAlignType as HAlign,
    ToolIconType as ToolIcon,
    VAlignType as VAlign,
)
from ..core.property.bases import Property

type CSSLengthType = str
CSSLength = Property[CSSLengthType]     # 10px 1.2em, etc.

type CSSClassType = str
CSSClass = Property[CSSClassType]       # ^\..*$

type CSSVariableType = str
CSSVariable = Property[CSSVariableType] # ^--.*$

type DataImageType = str
DataImage = Property[DataImageType]     # ^data:image.*$

# Image has to be first! see #12775, temporary fix
type IconLikeType = Image | ToolIcon | CSSClass | CSSVariable | DataImage
IconLike = Property[IconLikeType]

class XY[T](TypedDict):
    x: NotRequired[T]
    y: NotRequired[T]

class LRTB[T](TypedDict):
    left: NotRequired[T]
    right: NotRequired[T]
    top: NotRequired[T]
    bottom: NotRequired[T]

class Corners[T](TypedDict):
    top_left: NotRequired[T]
    top_right: NotRequired[T]
    bottom_right: NotRequired[T]
    bottom_left: NotRequired[T]

type Pixels = NonNegative[int]

type HAnchor = Align | HAlign | float
type VAnchor = Align | VAlign | float

type Anchor = AnchorType | tuple[HAnchor, VAnchor]

type AutoAnchor = Auto | Anchor | tuple[Auto | HAnchor, Auto | VAnchor]

type TextAnchor = Anchor | Auto

type BorderRadius = Pixels | tuple[Pixels, Pixels, Pixels, Pixels] | Corners[Pixels]

type Padding = Pixels | tuple[Pixels, Pixels] | XY[Pixels] | tuple[Pixels, Pixels, Pixels, Pixels] | Corners[Pixels]

type GridSpacing = Pixels | tuple[Pixels, Pixels]

type TrackAlign = Literal["start", "center", "end", "auto"]

type TrackSize = str

class FullTrackSize(TypedDict):
    size: NotRequired[TrackSize]
    align: NotRequired[TrackAlign]

type TrackSizing = TrackSize | FullTrackSize

type TracksSizing = TrackSizing | list[TrackSizing] | dict[int, TrackSizing]
