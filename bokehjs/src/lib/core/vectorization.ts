import {isPlainObject} from "./util/types"
import {Arrayable} from "./types"
import {ColumnarDataSource} from "../models/sources/columnar_data_source"

export type ScalarTransform<In, Out = In> = {
  compute(x: In): Out
}

export type VectorTransform<In, Out = In> = {
  v_compute(xs: Arrayable<In>): Arrayable<Out>
}

export type Transform<In, Out = In> = ScalarTransform<In, Out> & VectorTransform<In, Out>

export type Expression<Out> = {
  v_compute(source: ColumnarDataSource): Arrayable<Out>
}

export type Value<T> = {
  value: T
}

export type Field = {
  field: string
}

export type Expr<T> = {
  expr: Expression<T>
}

export type Scalar<T> = Value<T>

export type Vector<T> = Value<T> | Field | Expr<T>

export type Dimensional<T, U> = T & {units?: U}

export type Transformed<T> = {
  transform?: Transform<T, T>
}

export function isValue<T>(obj: unknown): obj is Value<T> {
  return isPlainObject(obj) && "value" in obj
}

export function isField(obj: unknown): obj is Field {
  return isPlainObject(obj) && "field" in obj
}
