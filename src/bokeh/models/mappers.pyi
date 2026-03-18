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
from .transforms import Transform, _TransformInit

class _MapperInit(_TransformInit, total=False):
    ...

class Mapper(Transform):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MapperInit]) -> None: ...

class _ColorMapperInit(_MapperInit, total=False):
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

class _CategoricalMapperInit(_MapperInit, total=False):
    factors: FactorSeq
    start: int
    end: int | None

class CategoricalMapper(Mapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_CategoricalMapperInit]) -> None: ...

    factors: FactorSeq = ...
    start: int = ...
    end: int | None = ...

class _CategoricalColorMapperInit(_CategoricalMapperInit, _ColorMapperInit, total=False):
    ...

class CategoricalColorMapper(CategoricalMapper, ColorMapper):
    def __init__(self, **kwargs: Unpack[_CategoricalColorMapperInit]) -> None: ...

class _CategoricalMarkerMapperInit(_CategoricalMapperInit, total=False):
    markers: Sequence[MarkerType]
    default_value: MarkerType

class CategoricalMarkerMapper(CategoricalMapper):
    def __init__(self, **kwargs: Unpack[_CategoricalMarkerMapperInit]) -> None: ...

    markers: Sequence[MarkerType] = ...
    default_value: MarkerType = ...

class _CategoricalPatternMapperInit(_CategoricalMapperInit, total=False):
    patterns: Sequence[HatchPattern]
    default_value: HatchPattern

class CategoricalPatternMapper(CategoricalMapper):
    def __init__(self, **kwargs: Unpack[_CategoricalPatternMapperInit]) -> None: ...

    patterns: Sequence[HatchPattern] = ...
    default_value: HatchPattern = ...

class _ContinuousColorMapperInit(_ColorMapperInit, total=False):
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

class _LinearColorMapperInit(_ContinuousColorMapperInit, total=False):
    ...

class LinearColorMapper(ContinuousColorMapper):
    def __init__(self, **kwargs: Unpack[_LinearColorMapperInit]) -> None: ...

class _LogColorMapperInit(_ContinuousColorMapperInit, total=False):
    ...

class LogColorMapper(ContinuousColorMapper):
    def __init__(self, **kwargs: Unpack[_LogColorMapperInit]) -> None: ...

class _ScanningColorMapperInit(_ContinuousColorMapperInit, total=False):
    ...

class ScanningColorMapper(ContinuousColorMapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ScanningColorMapperInit]) -> None: ...

class _EqHistColorMapperInit(_ScanningColorMapperInit, total=False):
    bins: int
    rescale_discrete_levels: bool

class EqHistColorMapper(ScanningColorMapper):
    def __init__(self, **kwargs: Unpack[_EqHistColorMapperInit]) -> None: ...

    bins: int = ...
    rescale_discrete_levels: bool = ...

class _StackColorMapperInit(_ColorMapperInit, total=False):
    ...

class StackColorMapper(ColorMapper):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_StackColorMapperInit]) -> None: ...

class _WeightedStackColorMapperInit(_StackColorMapperInit, total=False):
    alpha_mapper: ContinuousColorMapper
    color_baseline: float | None
    stack_labels: Sequence[str] | None

class WeightedStackColorMapper(StackColorMapper):
    def __init__(self, **kwargs: Unpack[_WeightedStackColorMapperInit]) -> None: ...

    alpha_mapper: ContinuousColorMapper = ...
    color_baseline: float | None = ...
    stack_labels: Sequence[str] | None = ...
