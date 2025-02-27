#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Sequence

# Bokeh imports
from .._types import Color
from ..core.enums import MarkerTypeType as MarkerType, PaletteType as Palette
from ..core.has_props import abstract
from ..core.property.visual import HatchPatternType as HatchPattern
from .glyphs import Glyph
from .ranges import FactorSeq
from .renderers import GlyphRenderer
from .transforms import Transform

@abstract
@dataclass(init=False)
class Mapper(Transform):
    ...

@abstract
@dataclass(init=False)
class ColorMapper(Mapper):

    palette: Sequence[Color] | Palette = ...

    nan_color: Color = ...

@abstract
@dataclass(init=False)
class CategoricalMapper(Mapper):

    factors: FactorSeq = ...

    start: int = ...

    end: int | None = ...

@dataclass
class CategoricalColorMapper(CategoricalMapper, ColorMapper):
    ...

@dataclass
class CategoricalMarkerMapper(CategoricalMapper):

    markers: Sequence[MarkerType] = ...

    default_value: MarkerType = ...

@dataclass
class CategoricalPatternMapper(CategoricalMapper):

    patterns: Sequence[HatchPattern] = ...

    default_value: HatchPattern = ...

@abstract
@dataclass(init=False)
class ContinuousColorMapper(ColorMapper):

    domain: list[tuple[GlyphRenderer[Glyph], str | list[str]]] = ...

    low: float | None = ...

    high: float | None = ...

    low_color: Color | None = ...

    high_color: Color | None = ...

@dataclass
class LinearColorMapper(ContinuousColorMapper):
    ...

@dataclass
class LogColorMapper(ContinuousColorMapper):
    ...

@abstract
@dataclass(init=False)
class ScanningColorMapper(ContinuousColorMapper):
    ...

@dataclass
class EqHistColorMapper(ScanningColorMapper):

    bins: int = ...

    rescale_discrete_levels: bool = ...

@abstract
@dataclass(init=False)
class StackColorMapper(ColorMapper):
    ...

@dataclass
class WeightedStackColorMapper(StackColorMapper):

    alpha_mapper: ContinuousColorMapper = ...

    color_baseline: float | None = ...

    stack_labels: Sequence[str] | None = ...
