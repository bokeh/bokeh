from dataclasses import dataclass
from typing import Literal, NotRequired, TypedDict

from ..core.enums import (
    AlignType as Align,
    AutoType as Auto,
    DimensionsType as Dimensions,
    FlowModeType as FlowMode,
    SizingModeType as SizingMode,
    SizingPolicyType as SizingPolicy,
)
from .ui import Pane

type NonNegative[T] = T

@dataclass(init=False)
class LayoutDOM(Pane):

    disabled: bool = ...

    width: NonNegative[int] | None = ...

    height: NonNegative[int] | None = ...

    min_width: NonNegative[int] | None = ...

    min_height: NonNegative[int] | None = ...

    max_width: NonNegative[int] | None = ...

    max_height: NonNegative[int] | None = ...

    margin: int | tuple[int, int] | tuple[int, int, int, int] | None = ...

    width_policy: Auto | SizingPolicy = ...

    height_policy: Auto | SizingPolicy = ...

    aspect_ratio: Auto | float | None

    flow_mode: FlowMode = ...

    sizing_mode: SizingMode | None = ...

    align: Auto | Align | tuple[Align, Align] = ...

    resizable: bool | Dimensions = ...

@dataclass
class Spacer(LayoutDOM):
    ...

class GridCommon:

    rows: TracksSizing | None

    cols: TracksSizing | None

    spacing: GridSpacing

type Pixels = NonNegative[int]

type GridSpacing = Pixels | tuple[Pixels, Pixels]

type TrackAlign = Literal["start", "center", "end", "auto"]

type TrackSize = str

class FullTrackSize(TypedDict):
    size: NotRequired[TrackSize]
    align: NotRequired[TrackAlign]

type TrackSizing = TrackSize | FullTrackSize

type TracksSizing = TrackSizing | list[TrackSizing] | dict[int, TrackSizing]
