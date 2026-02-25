#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING, Sequence

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from .._types import Color
from ..core.enums import MarkerTypeType as MarkerType, PaletteType as Palette
from ..core.property.visual import HatchPatternType as HatchPattern
from .glyph import Glyph
from .ranges import FactorSeq
from .renderers import GlyphRenderer
from .transforms import Transform

from ..model.model import JSEventCallback
from typing import Any
from typing import TypedDict

class _MapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool

class Mapper(Transform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MapperInit]) -> None: ...

class _ColorMapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    palette: Sequence[Color] | Palette
    nan_color: Color

class ColorMapper(Mapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ColorMapperInit]) -> None: ...

    @property
    def palette(self) -> Sequence[Color]: ...
    @palette.setter
    def palette(self, palette: Sequence[Color] | Palette) -> None: ...

    nan_color: Color = ...

class _CategoricalMapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    factors: FactorSeq
    start: int
    end: int | None

class CategoricalMapper(Mapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CategoricalMapperInit]) -> None: ...

    factors: FactorSeq = ...
    start: int = ...
    end: int | None = ...

class _CategoricalColorMapperInit(TypedDict, ColorMapper, total=False): # TODO _ColorMapperInit ... class CategoricalColorMapper(CategoricalMapper):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    factors: FactorSeq
    start: int
    end: int | None

class _CategoricalMarkerMapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    factors: FactorSeq
    start: int
    end: int | None
    markers: Sequence[MarkerType]
    default_value: MarkerType

class CategoricalMarkerMapper(CategoricalMapper):
    def __init__(self, **kwargs: Unpack[_CategoricalMarkerMapperInit]) -> None: ...

    markers: Sequence[MarkerType] = ...
    default_value: MarkerType = ...

class _CategoricalPatternMapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    factors: FactorSeq
    start: int
    end: int | None
    patterns: Sequence[HatchPattern]
    default_value: HatchPattern

class CategoricalPatternMapper(CategoricalMapper):
    def __init__(self, **kwargs: Unpack[_CategoricalPatternMapperInit]) -> None: ...

    patterns: Sequence[HatchPattern] = ...
    default_value: HatchPattern = ...

class _ContinuousColorMapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    palette: Sequence[Color] | Palette
    nan_color: Color
    domain: list[tuple[GlyphRenderer[Glyph], str | list[str]]]
    low: float | None
    high: float | None
    low_color: Color | None
    high_color: Color | None

class ContinuousColorMapper(ColorMapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ContinuousColorMapperInit]) -> None: ...

    domain: list[tuple[GlyphRenderer[Glyph], str | list[str]]] = ...
    low: float | None = ...
    high: float | None = ...
    low_color: Color | None = ...
    high_color: Color | None = ...

class _LinearColorMapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    palette: Sequence[Color] | Palette
    nan_color: Color
    domain: list[tuple[GlyphRenderer[Glyph], str | list[str]]]
    low: float | None
    high: float | None
    low_color: Color | None
    high_color: Color | None

class LinearColorMapper(ContinuousColorMapper):
    def __init__(self, **kwargs: Unpack[_LinearColorMapperInit]) -> None: ...

class _LogColorMapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    palette: Sequence[Color] | Palette
    nan_color: Color
    domain: list[tuple[GlyphRenderer[Glyph], str | list[str]]]
    low: float | None
    high: float | None
    low_color: Color | None
    high_color: Color | None

class LogColorMapper(ContinuousColorMapper):
    def __init__(self, **kwargs: Unpack[_LogColorMapperInit]) -> None: ...

class _ScanningColorMapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    palette: Sequence[Color] | Palette
    nan_color: Color
    domain: list[tuple[GlyphRenderer[Glyph], str | list[str]]]
    low: float | None
    high: float | None
    low_color: Color | None
    high_color: Color | None

class ScanningColorMapper(ContinuousColorMapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ScanningColorMapperInit]) -> None: ...

class _EqHistColorMapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    palette: Sequence[Color] | Palette
    nan_color: Color
    domain: list[tuple[GlyphRenderer[Glyph], str | list[str]]]
    low: float | None
    high: float | None
    low_color: Color | None
    high_color: Color | None
    bins: int
    rescale_discrete_levels: bool

class EqHistColorMapper(ScanningColorMapper):
    def __init__(self, **kwargs: Unpack[_EqHistColorMapperInit]) -> None: ...

    bins: int = ...
    rescale_discrete_levels: bool = ...

class _StackColorMapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    palette: Sequence[Color] | Palette
    nan_color: Color

class StackColorMapper(ColorMapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_StackColorMapperInit]) -> None: ...

class _WeightedStackColorMapperInit(TypedDict, total=False):
    name: str | None
    tags: list[Any]
    js_event_callbacks: dict[str, list[JSEventCallback]]
    js_property_callbacks: dict[str, list[JSEventCallback]]
    subscribed_events: set[str]
    syncable: bool
    palette: Sequence[Color] | Palette
    nan_color: Color
    alpha_mapper: ContinuousColorMapper
    color_baseline: float | None
    stack_labels: Sequence[str] | None

class WeightedStackColorMapper(StackColorMapper):
    def __init__(self, **kwargs: Unpack[_WeightedStackColorMapperInit]) -> None: ...

    alpha_mapper: ContinuousColorMapper = ...
    color_baseline: float | None = ...
    stack_labels: Sequence[str] | None = ...
