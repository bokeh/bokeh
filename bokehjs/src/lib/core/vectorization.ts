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

export type SpecType = "value" | "field" | "expr"

export type SpecModifiers<T, Units = never> = {
  transform?: Transform<unknown, T>
  units?: Units
}

export type Value<T, Units = never> = Partial<Serializable> & SpecModifiers<T, Units> & {
  readonly type: "value"
  value: T
}

export type Field<T = never, Units = never> = Partial<Serializable> & SpecModifiers<T, Units> & {
  readonly type: "field"
  value: string
}

export type Expr<T, Units = never> = Partial<Serializable> & SpecModifiers<T, Units> & {
  readonly type: "expr"
  value: Expression<T>
}

export type Scalar<T, Units = never> = Value<T, Units> | Expr<T, Units>

export type Vector<T, Units = never> = Value<T, Units> | Field<T, Units> | Expr<T, Units>

export type Transformed<T> = SpecModifiers<T>

function is_transform(obj: object): boolean {
  return "compute" in obj && "v_compute" in obj && "change" in obj
}

function spec_modifiers(arg: object): object {
  return is_transform(arg) ? {transform: arg} : arg
}

export function value<T, In>(value: T, transform: Transform<In, T>): Value<T>
export function value<T, Units = never>(value: T, modifiers?: SpecModifiers<T, Units>): Value<T, Units>
export function value<T, Units = never>(value: T, arg: object = {}): Value<T, Units> {
  return {type: "value", value, ...spec_modifiers(arg)}
}

export function field<In, T>(value: string, transform: Transform<In, T>): Field<T>
export function field<T = never, Units = never>(value: string, modifiers?: SpecModifiers<T, Units>): Field<T, Units>
export function field<T = never, Units = never>(value: string, arg: object = {}): Field<T, Units> {
  return {type: "field", value, ...spec_modifiers(arg)}
}

export function expr<T, In>(value: Expression<T>, transform: Transform<In, T>): Expr<T>
export function expr<T, Units = never>(value: Expression<T>, modifiers?: SpecModifiers<T, Units>): Expr<T, Units>
export function expr<T, Units = never>(value: Expression<T>, arg: object = {}): Expr<T, Units> {
  return {type: "expr", value, ...spec_modifiers(arg)}
}

function is_of_type(obj: unknown, type: SpecType): boolean {
  if (!isPlainObject(obj)) {
    return false
  }
  if (obj.type != type || !("value" in obj)) {
    return false
  }
  let n = size(obj) - 2
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

export function isVectorized<T = unknown, Units = unknown>(obj: unknown): obj is Vector<T, Units> {
  return isValue(obj) || isField(obj) || isExpr(obj)
}
