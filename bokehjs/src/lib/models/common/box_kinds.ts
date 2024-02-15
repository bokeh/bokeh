import {Enum, Nullable, Number, Or, Ref} from "../../core/kinds"
import {Node} from "../coordinates/node"

export const Corner = Enum("top_left", "top_right", "bottom_left", "bottom_right")
export type Corner = typeof Corner["__type__"]

export const Edge = Enum("left", "right", "top", "bottom")
export type Edge = typeof Edge["__type__"]

export const HitTarget = Enum(...Corner, ...Edge, "area")
export type HitTarget = typeof HitTarget["__type__"]

export const Resizable = Enum("none", "left", "right", "top", "bottom", "x", "y", "all")
export type Resizable = typeof Resizable["__type__"]

export const Movable = Enum("none", "x", "y", "both")
export type Movable = typeof Movable["__type__"]

export const Limit = Nullable(Or(Number, Ref(Node)))
export type Limit = typeof Limit["__type__"]
