#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Literal, NotRequired, TypedDict

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
from ..core.property.visual import ImageType

type CSSLengthType = str
class CSSLength(Property[CSSLengthType]): ...     # 10px 1.2em, etc.

type CSSClassType = str
class CSSClass(Property[CSSClassType]): ...       # ^\..*$

type CSSVariableType = str
class CSSVariable(Property[CSSVariableType]): ... # ^--.*$

type DataImageType = str
class DataImage(Property[DataImageType]): ...     # ^data:image.*$

# Image has to be first! see #12775, temporary fix
type IconLikeType = ImageType | ToolIcon | CSSClassType | CSSVariableType | DataImageType
class IconLike(Property[IconLikeType]): ...

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
class Pixels(Property[PixelsType]): ...

type HAnchorType = Align | HAlign | float
class HAnchor(Property[HAnchorType]): ...

type VAnchorType = Align | VAlign | float
class VAnchor(Property[VAnchorType]): ...

type AnchorType = Anchor_ | tuple[HAnchorType, VAnchorType]
class Anchor(Property[AnchorType]): ...

type AutoAnchorType = Auto | AnchorType | tuple[Auto | HAnchorType, Auto | VAnchorType]
class AutoAnchor(Property[AutoAnchorType]): ...

type TextAnchorType = AnchorType | Auto
class TextAnchor(Property[TextAnchorType]): ...

type BorderRadiusType = PixelsType | tuple[PixelsType, PixelsType, PixelsType, PixelsType] | Corners[PixelsType]
class BorderRadius(Property[BorderRadiusType]): ...

type PaddingType = PixelsType | tuple[PixelsType, PixelsType] | XY[PixelsType] | tuple[PixelsType, PixelsType, PixelsType, PixelsType] | Corners[PixelsType]
class Padding(Property[PaddingType]): ...

type GridSpacingType = PixelsType | tuple[PixelsType, PixelsType]
class GridSpacing(Property[GridSpacingType]): ...

type TrackAlignType = Literal["start", "center", "end", "auto"]
class TrackAlign(Property[TrackAlignType]): ...

type TrackSizeType = str
class TrackSize(Property[TrackSizeType]): ...

class FullTrackSize(TypedDict):
    size: NotRequired[TrackSizeType]
    align: NotRequired[TrackAlignType]

type TrackSizingType = TrackSizeType | FullTrackSize
class TrackSizing(Property[TrackSizingType]): ...

type TracksSizingType = TrackSizingType | list[TrackSizingType] | dict[int, TrackSizingType]
class TracksSizing(Property[TracksSizingType]): ...
