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
    AnchorType as Anchor_,
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

type PixelsType = NonNegative[int]
Pixels = Property[PixelsType]

type HAnchorType = Align | HAlign | float
HAnchor = Property[HAnchorType]

type VAnchorType = Align | VAlign | float
VAnchor = Property[VAnchorType]

type AnchorType = Anchor_ | tuple[HAnchor, VAnchor]
Anchor = Property[AnchorType]

type AutoAnchorType = Auto | Anchor | tuple[Auto | HAnchor, Auto | VAnchor]
AutoAnchor = Property[AutoAnchorType]

type TextAnchorType = Anchor | Auto
TextAnchor = Property[TextAnchorType]

type BorderRadiusType = Pixels | tuple[Pixels, Pixels, Pixels, Pixels] | Corners[Pixels]
BorderRadius = Property[BorderRadiusType]

type PaddingType = Pixels | tuple[Pixels, Pixels] | XY[Pixels] | tuple[Pixels, Pixels, Pixels, Pixels] | Corners[Pixels]
Padding = Property[PaddingType]

type GridSpacingType = Pixels | tuple[Pixels, Pixels]
GridSpacing = Property[GridSpacingType]

type TrackAlignType = Literal["start", "center", "end", "auto"]
TrackAlign = Property[TrackAlignType]

type TrackSizeType = str
TrackSize = Property[TrackSizeType]

class FullTrackSize(TypedDict):
    size: NotRequired[TrackSize]
    align: NotRequired[TrackAlign]

type TrackSizingType = TrackSize | FullTrackSize
TrackSizing = Property[TrackSizingType]

type TracksSizingType = TrackSizing | list[TrackSizing] | dict[int, TrackSizing]
TracksSizing = Property[TracksSizingType]
