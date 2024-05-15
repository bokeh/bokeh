import type {Kind, Constructor} from "core/kinds"
import {
  List,
  Auto,
  Enum,
  Int,
  Mapping,
  NonNegative,
  Opt,
  Or,
  PartialStruct,
  Percent,
  Ref,
  Str,
  Tuple,
} from "core/kinds"
import type {HasProps} from "core/has_props"
import * as enums from "core/enums"
import * as p from "core/properties"

export const Length = NonNegative(Int)
export type Length = typeof Length["__type__"]

const XY = <T>(type: Kind<T>) => PartialStruct({x: type, y: type})

const LRTB = <T>(type: Kind<T>) => PartialStruct({left: type, right: type, top: type, bottom: type})

export const Anchor = (
  Or(
    enums.Anchor,
    Tuple(
      Or(enums.Align, enums.HAlign, Percent),
      Or(enums.Align, enums.VAlign, Percent),
    ),
  )
)
export type Anchor = typeof Anchor["__type__"]

export const TextAnchor = Or(Anchor, Auto)
export type TextAnchor = typeof TextAnchor["__type__"]

export const Padding = (
  Or(
    Length,
    Tuple(Length, Length),
    XY(Length),
    Tuple(Length, Length, Length, Length),
    LRTB(Length),
  )
)
export type Padding = typeof Padding["__type__"]

export const BorderRadius = (
  Or(
    Length,
    Tuple(Length, Length, Length, Length),
    PartialStruct({
      top_left: Length,
      top_right: Length,
      bottom_right: Length,
      bottom_left: Length,
    }),
  )
)
export type BorderRadius = typeof BorderRadius["__type__"]

export const Index = NonNegative(Int)
export type Index = typeof Index["__type__"]

export const Span = NonNegative(Int)
export type Span = typeof Span["__type__"]

export const GridChild = <T extends HasProps>(child: Constructor<T>) => Tuple(Ref(child), Index, Index, Opt(Span), Opt(Span))

export const GridSpacing = Or(Length, Tuple(Length, Length))
export type GridSpacing = typeof GridSpacing["__type__"]

export const TrackAlign = Enum("start", "center", "end", "auto")
export type TrackAlign = typeof TrackAlign["__type__"]

export const TrackSize = Str
export type TrackSize = typeof TrackSize["__type__"]

export const TrackSizing = PartialStruct({size: TrackSize, align: TrackAlign})
export type TrackSizing = typeof TrackSizing["__type__"]

export const TrackSizingLike = Or(TrackSize, TrackSizing)
export type TrackSizingLike = typeof TrackSizingLike["__type__"]

export const TracksSizing = Or(TrackSizingLike, List(TrackSizingLike), Mapping(Int, TrackSizingLike))
export type TracksSizing = typeof TracksSizing["__type__"]

export class TextAnchorSpec extends p.DataSpec<TextAnchor> {}
export class OutlineShapeSpec extends p.DataSpec<enums.OutlineShapeName> {}
