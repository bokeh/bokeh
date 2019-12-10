import {isPlainObject} from "./util/types"
import {Arrayable} from "./types"
import {ColumnarDataSource} from "../models/sources/columnar_data_source"

export type Transform<In, Out> = {
  compute(x: In): Out
  v_compute(xs: Arrayable<In>): Arrayable<Out>
}

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

export type Scalar<T> = Value<T> & Transformable<T>

export type Vector<T> = (Value<T> | Field | Expr<T>) & Transformable<T>

export type Dimensional<T, U> = T & {units?: U}

export type Transformable<T> = {
  transform?: Transform<T, T>
}

export function is_Value<T>(obj: Value<T> | Field | Expr<T>): obj is Value<T> {
  return "value" in obj
}

export function is_Field<T>(obj: Value<T> | Field | Expr<T>): obj is Field {
  return "field" in obj
}

export function is_Expr<T>(obj: Value<T> | Field | Expr<T>): obj is Expr<T> {
  return "expr" in obj
}

export function is_Spec<T>(obj: unknown): obj is Value<T> | Field | Expr<T> {
  return isPlainObject(obj) && ("value" in obj || "field" in obj || "expr" in obj)
}
