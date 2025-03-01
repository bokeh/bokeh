#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import (
    Generic,
    Literal,
    NotRequired,
    TypeAlias,
    TypedDict,
    TypeVar,
)

# Bokeh imports
from .._types import NonNegative
from ..core.enums import (
    AlignType as Align,
    AnchorType as Anchor_,
    AutoType as Auto,
    HAlignType as HAlign,
    ToolIconType as ToolIcon,
    VAlignType as VAlign,
)
from ..core.property.bases import Property
from ..core.property.visual import ImageType as Image

CSSLengthType: TypeAlias = str
CSSLength: TypeAlias = Property[CSSLengthType]     # 10px 1.2em, etc.

CSSClassType: TypeAlias = str
CSSClass: TypeAlias = Property[CSSClassType]       # ^\..*$

CSSVariableType: TypeAlias = str
CSSVariable: TypeAlias = Property[CSSVariableType] # ^--.*$

DataImageType: TypeAlias = str
DataImage: TypeAlias = Property[DataImageType]     # ^data:image.*$

# Image has to be first! see #12775, temporary fix
IconLikeType: TypeAlias = Image | ToolIcon | CSSClass | CSSVariable | DataImage
IconLike: TypeAlias = Property[IconLikeType]

T = TypeVar("T")

class XY(TypedDict, Generic[T]):
    x: NotRequired[T]
    y: NotRequired[T]

class LRTB(TypedDict, Generic[T]):
    left: NotRequired[T]
    right: NotRequired[T]
    top: NotRequired[T]
    bottom: NotRequired[T]

class Corners(TypedDict, Generic[T]):
    top_left: NotRequired[T]
    top_right: NotRequired[T]
    bottom_right: NotRequired[T]
    bottom_left: NotRequired[T]

PixelsType: TypeAlias = NonNegative[int]
Pixels: TypeAlias = Property[PixelsType]

HAnchorType: TypeAlias = Align | HAlign | float
HAnchor: TypeAlias = Property[HAnchorType]

VAnchorType: TypeAlias = Align | VAlign | float
VAnchor: TypeAlias = Property[VAnchorType]

AnchorType: TypeAlias = Anchor_ | tuple[HAnchor, VAnchor]
Anchor: TypeAlias = Property[AnchorType]

AutoAnchorType: TypeAlias = Auto | Anchor | tuple[Auto | HAnchor, Auto | VAnchor]
AutoAnchor: TypeAlias = Property[AutoAnchorType]

TextAnchorType: TypeAlias = Anchor | Auto
TextAnchor: TypeAlias = Property[TextAnchorType]

BorderRadiusType: TypeAlias = Pixels | tuple[Pixels, Pixels, Pixels, Pixels] | Corners[Pixels]
BorderRadius: TypeAlias = Property[BorderRadiusType]

PaddingType: TypeAlias = Pixels | tuple[Pixels, Pixels] | XY[Pixels] | tuple[Pixels, Pixels, Pixels, Pixels] | Corners[Pixels]
Padding: TypeAlias = Property[PaddingType]

GridSpacingType: TypeAlias = Pixels | tuple[Pixels, Pixels]
GridSpacing: TypeAlias = Property[GridSpacingType]

TrackAlignType: TypeAlias = Literal["start", "center", "end", "auto"]
TrackAlign: TypeAlias = Property[TrackAlignType]

TrackSizeType: TypeAlias = str
TrackSize: TypeAlias = Property[TrackSizeType]

class FullTrackSize(TypedDict):
    size: NotRequired[TrackSize]
    align: NotRequired[TrackAlign]

TrackSizingType: TypeAlias = TrackSize | FullTrackSize
TrackSizing: TypeAlias = Property[TrackSizingType]

TracksSizingType: TypeAlias = TrackSizing | list[TrackSizing] | dict[int, TrackSizing]
TracksSizing: TypeAlias = Property[TracksSizingType]
