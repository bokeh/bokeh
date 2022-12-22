import {Kind, Int, Percent, NonNegative, Or, Tuple, PartialStruct, Auto} from "core/kinds"
import * as enums from "core/enums"

const Length = NonNegative(Int)

const XY = <T>(type: Kind<T>) => PartialStruct({x: type, y: type})

const LRTB = <T>(type: Kind<T>) => PartialStruct({left: type, right: type, top: type, bottom: type})

export type Anchor = typeof Anchor["__type__"]
export const Anchor = (
  Or(
    enums.Anchor,
    Tuple(
      Or(enums.Align, enums.HAlign, Percent),
      Or(enums.Align, enums.VAlign, Percent),
    ),
  )
)

export type TextAnchor = typeof TextAnchor["__type__"]
export const TextAnchor = Or(Anchor, Auto)

export type Padding = typeof Padding["__type__"]
export const Padding = (
  Or(
    Length,
    Tuple(Length, Length),
    XY(Length),
    Tuple(Length, Length, Length, Length),
    LRTB(Length),
  )
)

export type BorderRadius = typeof BorderRadius["__type__"]
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
