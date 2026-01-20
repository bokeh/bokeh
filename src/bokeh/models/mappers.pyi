#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Sequence, Unpack

# Bokeh imports
from .._types import Color
from ..core.enums import MarkerTypeType as MarkerType, PaletteType as Palette
from ..core.property.visual import HatchPatternType as HatchPattern
from .glyph import Glyph
from .ranges import FactorSeq
from .renderers import GlyphRenderer
from .transforms import Transform, TransformInit

class MapperInit(TransformInit, total=False):
    ...

class Mapper(Transform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[MapperInit]) -> None: ...

class ColorMapperInit(MapperInit, total=False):
    palette: Sequence[Color] | Palette
    nan_color: Color

class ColorMapper(Mapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ColorMapperInit]) -> None: ...

    @property
    def palette(self) -> Sequence[Color]: ...
    @palette.setter
    def palette(self, palette: Sequence[Color] | Palette) -> None: ...

    nan_color: Color = ...

class CategoricalMapperInit(MapperInit, total=False):
    factors: FactorSeq
    start: int
    end: int | None

class CategoricalMapper(Mapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[CategoricalMapperInit]) -> None: ...

    factors: FactorSeq = ...
    start: int = ...
    end: int | None = ...

class CategoricalColorMapperInit(CategoricalMapperInit, ColorMapperInit, total=False):
    ...

class CategoricalColorMapper(CategoricalMapper, ColorMapper):
    def __init__(self, **kwargs: Unpack[CategoricalColorMapperInit]) -> None: ...

class CategoricalMarkerMapperInit(CategoricalMapperInit, total=False):
    markers: Sequence[MarkerType]
    default_value: MarkerType

class CategoricalMarkerMapper(CategoricalMapper):
    def __init__(self, **kwargs: Unpack[CategoricalMarkerMapperInit]) -> None: ...

    markers: Sequence[MarkerType] = ...
    default_value: MarkerType = ...

class CategoricalPatternMapperInit(CategoricalMapperInit, total=False):
    patterns: Sequence[HatchPattern]
    default_value: HatchPattern

class CategoricalPatternMapper(CategoricalMapper):
    def __init__(self, **kwargs: Unpack[CategoricalPatternMapperInit]) -> None: ...

    patterns: Sequence[HatchPattern] = ...
    default_value: HatchPattern = ...

class ContinuousColorMapperInit(ColorMapperInit, total=False):
    domain: list[tuple[GlyphRenderer[Glyph], str | list[str]]]
    low: float | None
    high: float | None
    low_color: Color | None
    high_color: Color | None

class ContinuousColorMapper(ColorMapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ContinuousColorMapperInit]) -> None: ...

    domain: list[tuple[GlyphRenderer[Glyph], str | list[str]]] = ...
    low: float | None = ...
    high: float | None = ...
    low_color: Color | None = ...
    high_color: Color | None = ...

class LinearColorMapperInit(ContinuousColorMapperInit, total=False):
    ...

class LinearColorMapper(ContinuousColorMapper):
    def __init__(self, **kwargs: Unpack[LinearColorMapperInit]) -> None: ...

class LogColorMapperInit(ContinuousColorMapperInit, total=False):
    ...

class LogColorMapper(ContinuousColorMapper):
    def __init__(self, **kwargs: Unpack[LogColorMapperInit]) -> None: ...

class ScanningColorMapperInit(ContinuousColorMapperInit, total=False):
    ...

class ScanningColorMapper(ContinuousColorMapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[ScanningColorMapperInit]) -> None: ...

class EqHistColorMapperInit(ScanningColorMapperInit, total=False):
    bins: int
    rescale_discrete_levels: bool

class EqHistColorMapper(ScanningColorMapper):
    def __init__(self, **kwargs: Unpack[EqHistColorMapperInit]) -> None: ...

    bins: int = ...
    rescale_discrete_levels: bool = ...

class StackColorMapperInit(ColorMapperInit, total=False):
    ...

class StackColorMapper(ColorMapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[StackColorMapperInit]) -> None: ...

class WeightedStackColorMapperInit(StackColorMapperInit, total=False):
    alpha_mapper: ContinuousColorMapper
    color_baseline: float | None
    stack_labels: Sequence[str] | None

class WeightedStackColorMapper(StackColorMapper):
    def __init__(self, **kwargs: Unpack[WeightedStackColorMapperInit]) -> None: ...

    alpha_mapper: ContinuousColorMapper = ...
    color_baseline: float | None = ...
    stack_labels: Sequence[str] | None = ...
