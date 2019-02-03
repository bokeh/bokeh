import {isObject} from "core/util/types"

export type Value<T> = {
  value: T
}

export type Field = {
  field: string
}

export type Scalar<T> = T | Value<T>

export type Vectorized<T> = T | Value<T> | Field

/*
import {Color} from "./types"
import {SpatialUnits, AngleUnits} from "./enums"

export type AngleSpec = Vectorized<number> & { units?: AngleUnits }

export type ColorSpec = Vectorized<Color | null>

export type DistanceSpec = Vectorized<number> & { units?: SpatialUnits }

export type FontSizeSpec = Vectorized<string>

export type NumberSpec = Vectorized<number>

export type StringSpec = Vectorized<string>
*/

export function isValue<T>(obj: Scalar<T> | Vectorized<T>): obj is Value<T> {
  return isObject(obj) && "value" in (obj as any)
}

export function isField<T>(obj: Vectorized<T>): obj is Field {
  return isObject(obj) && "field" in (obj as any)
}
