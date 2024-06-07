import {isPlainObject} from "./util/types"
import {size} from "./util/object"
import type {Arrayable} from "./types"
import type {HasProps} from "./has_props"
import type {Signal0} from "./signaling"
import type {ColumnarDataSource} from "../models/sources/columnar_data_source"

export type Transform<In, Out> = {
  compute(x: In): Out
  v_compute(xs: Arrayable<In>): Arrayable<Out>
  change: Signal0<HasProps>
}

export type ScalarExpression<Out> = {
  compute(source: ColumnarDataSource): Out
  change: Signal0<HasProps>
}

export type VectorExpression<Out> = {
  v_compute(source: ColumnarDataSource): Arrayable<Out>
  change: Signal0<HasProps>
}

export type Expression<T> = ScalarExpression<T> | VectorExpression<T>

import type {Serializable} from "./serialization"

export type Value<T> = Partial<Serializable> & {
  value: T
}

export type Field = Partial<Serializable> & {
  field: string
}

export type Expr<T> = Partial<Serializable> & {
  expr: Expression<T>
}

export type Scalar<T> = Value<T> & Transformed<T>

export type Vector<T> = (Value<T> | Field | Expr<T>) & Transformed<T>

export type Dimensional<T, U> = T & {units?: U}

export type Transformed<T> = {
  transform?: Transform<unknown, T>
}

function is_of_type(obj: unknown, field: string): boolean {
  if (!isPlainObject(obj)) {
    return false
  }
  if (!(field in obj)) {
    return false
  }
  let n = size(obj) - 1
  if ("transform" in obj) {
    n -= 1
  }
  if ("units" in obj) {
    n -= 1
  }
  return n == 0
}

export function isValue<T>(obj: unknown): obj is Value<T> {
  return is_of_type(obj, "value")
}

export function isField(obj: unknown): obj is Field {
  return is_of_type(obj, "field")
}

export function isExpr<T>(obj: unknown): obj is Expr<T> {
  return is_of_type(obj, "expr")
}

export function isVectorized<T>(obj: unknown): obj is Vector<T> {
  return isValue(obj) || isField(obj) || isExpr(obj)
}
