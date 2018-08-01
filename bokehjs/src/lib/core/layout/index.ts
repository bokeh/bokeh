export type Size = {
  width: number
  height: number
}

export type Margin = {
  left: number
  top: number
  right: number
  bottom: number
}

export type SizeHint = Size & {inner?: Margin}

export {BBox} from "../util/bbox"

export interface Variable {
  value: number
}

export interface ComputedVariable {
  readonly value: number
}
