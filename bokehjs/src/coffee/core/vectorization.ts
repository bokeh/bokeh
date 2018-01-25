import {SpatialUnits, AngleUnits} from "./enums"

export interface Value<T> {
  value: T
}

export interface Field {
  field: string
}

export type Vectorized<T> = Value<T> | Field

export type AngleSpec = Vectorized<number> & { units?: AngleUnits }

export type ColorSpec = Vectorized<string> // XXX: Color

export type DirectionSpec = Vectorized<number> & { units?: SpatialUnits }

export type DistanceSpec = Vectorized<number> & { units?: SpatialUnits }

export type FontSizeSpec = Vectorized<string>

export type NumberSpec = Vectorized<number>

export type StringSpec = Vectorized<string>
