import type {Kind, Constructor, Infer} from "core/kinds"
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
  PrefixedStr,
  Ref,
  Str,
  Tuple,
} from "core/kinds"
import type {HasProps} from "core/has_props"
import * as enums from "core/enums"

export const Length = NonNegative(Int)
export type Length = Infer<typeof Length>

const XY = <T>(type: Kind<T>) => PartialStruct({x: type, y: type})

const LRTB = <T>(type: Kind<T>) => PartialStruct({left: type, right: type, top: type, bottom: type})

export const HAnchor = Or(enums.Align, enums.HAlign, Percent)
export type HAnchor = Infer<typeof HAnchor>

export const VAnchor = Or(enums.Align, enums.VAlign, Percent)
export type VAnchor = Infer<typeof VAnchor>

export const Anchor = Or(enums.Anchor, Tuple(HAnchor, VAnchor))
export type Anchor = Infer<typeof Anchor>

export const AutoAnchor = Or(Auto, enums.Anchor, Tuple(Or(HAnchor, Auto), Or(VAnchor, Auto)))
export type AutoAnchor = Infer<typeof AutoAnchor>

export const TextAnchor = Or(Anchor, Auto)
export type TextAnchor = Infer<typeof TextAnchor>

export const Padding = (
  Or(
    Length,
    Tuple(Length, Length),
    XY(Length),
    Tuple(Length, Length, Length, Length),
    LRTB(Length),
  )
)
export type Padding = Infer<typeof Padding>

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
export type BorderRadius = Infer<typeof BorderRadius>

export const Index = NonNegative(Int)
export type Index = Infer<typeof Index>

export const Span = NonNegative(Int)
export type Span = Infer<typeof Span>

export const GridChild = <T extends HasProps>(child: Constructor<T>) => Tuple(Ref(child), Index, Index, Opt(Span), Opt(Span))

export const GridSpacing = Or(Length, Tuple(Length, Length))
export type GridSpacing = Infer<typeof GridSpacing>

export const TrackAlign = Enum("start", "center", "end", "auto")
export type TrackAlign = Infer<typeof TrackAlign>

export const TrackSize = Str
export type TrackSize = Infer<typeof TrackSize>

export const TrackSizing = PartialStruct({size: TrackSize, align: TrackAlign})
export type TrackSizing = Infer<typeof TrackSizing>

export const TrackSizingLike = Or(TrackSize, TrackSizing)
export type TrackSizingLike = Infer<typeof TrackSizingLike>

export const TracksSizing = Or(TrackSizingLike, List(TrackSizingLike), Mapping(Int, TrackSizingLike))
export type TracksSizing = Infer<typeof TracksSizing>

export const IconLike = Or(enums.ToolIcon, PrefixedStr("--"), PrefixedStr("."), PrefixedStr("data:image"))
export type IconLike = Infer<typeof IconLike>
