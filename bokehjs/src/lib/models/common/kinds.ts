import {Kind, Int, Percent, NonNegative, Or, Tuple, PartialStruct} from "core/kinds"
import * as enums from "core/enums"

const Length = NonNegative(Int)

const VH = <T>(type: Kind<T>) => PartialStruct({vertical: type, horizontal: type})

const TRBL = <T>(type: Kind<T>) => PartialStruct({top: type, right: type, bottom: type, left: type})

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

export type Padding = typeof Padding["__type__"]
export const Padding = (
  Or(
    Length,
    Tuple(Length, Length),
    VH(Length),
    Tuple(Length, Length, Length, Length),
    TRBL(Length),
  )
)

export type BorderRadius = typeof BorderRadius["__type__"]
export const BorderRadius = (
  Or(
    Length,
    PartialStruct({
      top_left: Length,
      top_right: Length,
      bottom_right: Length,
      bottom_left: Length,
    }),
  )
)
