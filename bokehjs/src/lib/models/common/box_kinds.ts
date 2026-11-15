import {Enum, Nullable, Float, Or, Ref} from "../../core/kinds"
import type {Infer} from "../../core/kinds"
import {Node} from "../coordinates/node"

export const Corner = Enum("top_left", "top_right", "bottom_left", "bottom_right")
export type Corner = Infer<typeof Corner>

export const Edge = Enum("left", "right", "top", "bottom")
export type Edge = Infer<typeof Edge>

export const HitTarget = Enum(...Corner, ...Edge, "area")
export type HitTarget = Infer<typeof HitTarget>

export const Resizable = Enum("none", "left", "right", "top", "bottom", "x", "y", "all")
export type Resizable = Infer<typeof Resizable>

export const Movable = Enum("none", "x", "y", "both")
export type Movable = Infer<typeof Movable>

export const Limit = Nullable(Or(Float, Ref(Node)))
export type Limit = Infer<typeof Limit>
