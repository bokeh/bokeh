import {Signal0} from "./signaling"
import {logger} from "./logging"
import type {HasProps} from "./has_props"
import * as enums from "./enums"
import type {Arrayable, IntArray, FloatArray, TypedArray, uint32, Dict} from "./types"
import {RGBAArray, ColorArray} from "./types"
import type * as types from "./types"
import {includes, repeat} from "./util/array"
import {mul} from "./util/arrayable"
import {to_radians_coeff} from "./util/math"
import {color2rgba, encode_rgba} from "./util/color"
import {to_big_endian} from "./util/platform"
import {isNumber, isTypedArray, isPlainObject} from "./util/types"
import type {Factor/*, OffsetFactor*/} from "../models/ranges/factor_range"
import type {ColumnarDataSource} from "../models/sources/columnar_data_source"
import type {/*Value,*/ Scalar, Vector, Dimensional, ScalarExpression, VectorExpression} from "./vectorization"
import {isValue, isField, isExpr} from "./vectorization"
import {settings} from "./settings"
import type {Kind} from "./kinds"
import {PrefixedStr} from "./kinds"
import type {NDArray, NDArrayType} from "./util/ndarray"
import {is_NDArray} from "./util/ndarray"
import {diagnostics} from "./diagnostics"
import {unreachable} from "./util/assert"
import {serialize} from "./serialization"
import type {RaggedArray} from "./util/ragged_array"

import {Uniform, UniformScalar, UniformVector, ColorUniformVector} from "./uniforms"
export {Uniform, UniformScalar, UniformVector}

function valueToString(value: any): string {
  try {
    return JSON.stringify(value)
  } catch {
    return value.toString()
  }
}

export function isSpec(obj: any): boolean {
  return isPlainObject(obj) &&
          ((obj.value === undefined ? 0 : 1) +
           (obj.field === undefined ? 0 : 1) +
           (obj.expr  === undefined ? 0 : 1) == 1) // garbage JS XOR
}

export interface Theme {
  get(obj: HasProps | typeof HasProps, attr: string): unknown
}

let global_theme: Theme | null = null

export function use_theme(theme: Theme | null = null): void {
  global_theme = theme
}

//
// Property base class
//

export type UniformsOf<Props> = {
  [Key in keyof Props as
    Props[Key] extends BaseCoordinateSpec<any> ? never   :
    Props[Key] extends VectorSpec<any, any>    ? Key     :
    Props[Key] extends ScalarSpec<any, any>    ? Key     : never]:
      Props[Key] extends VectorSpec<infer T, any> ? Uniform<T>       :
      Props[Key] extends ScalarSpec<infer T, any> ? UniformScalar<T> : never
}

export type MaxAttrsOf<Props> = {
  [Key in keyof Props & string as Props[Key] extends DistanceSpec ? `max_${Key}` : never]: number
}

export type CoordsAttrsOf<Props> = {
  [Key in keyof Props & string as Props[Key] extends BaseCoordinateSpec<any> ? Key : never]:
    Props[Key] extends CoordinateSpec          ? Arrayable<number> :
    Props[Key] extends CoordinateSeqSpec       ? RaggedArray<FloatArray> :
    Props[Key] extends CoordinateSeqSeqSeqSpec ? Arrayable<Arrayable<Arrayable<Arrayable<number>>>> : never
}

export type ScreenAttrsOf<Props> = {
  [Key in keyof Props & string as Props[Key] extends BaseCoordinateSpec<any> | DistanceSpec ? `s${Key}` : never]:
    Props[Key] extends CoordinateSpec | DistanceSpec ? Arrayable<number> :
    Props[Key] extends CoordinateSeqSpec             ? RaggedArray<FloatArray> :
    Props[Key] extends CoordinateSeqSeqSeqSpec       ? Arrayable<Arrayable<Arrayable<Arrayable<number>>>> : never
}
export type InheritedAttrsOf<Props> = {
  [Key in keyof Props & string as
    Props[Key] extends VectorSpec<any, any> ? `inherited_${Key}` :
    Props[Key] extends ScalarSpec<any, any> ? `inherited_${Key}` : never]: boolean
}

export type InheritedScreenOf<Props> = {
  [Key in keyof Props & string as Props[Key] extends BaseCoordinateSpec<any> | DistanceSpec ? `inherited_s${Key}` : never]: boolean
}

export type InheritedOf<Props> = InheritedAttrsOf<Props> & InheritedScreenOf<Props>

export type Expanded<T> = T extends infer Obj ? {[K in keyof Obj]: Obj[K]} : never

export type GlyphDataOf<Props> = Expanded<Readonly<CoordsAttrsOf<Props> & ScreenAttrsOf<Props> & MaxAttrsOf<Props> & UniformsOf<Props> & InheritedOf<Props>>>

export type AttrsOf<P> = {
  [K in keyof P]: P[K] extends Property<infer T> ? T : never
}

export type DefineOf<P, HP extends HasProps = HasProps> = {
  [K in keyof P]: P[K] extends Property<infer T> ? [PropertyConstructor<T> | PropertyAlias | Kind<T>, (Unset | T | ((obj: HP) => T))?, PropertyOptions<T>?] : never
}

export type DefaultsOf<P> = {
  [K in keyof P]: P[K] extends Property<infer T> ? T | ((obj: HasProps) => T) : never
}

type DefaultFn<T> = (obj: HasProps) => T

export type PropertyOptions<T> = {
  internal?: boolean
  readonly?: boolean
  convert?(value: T, obj: HasProps): T | undefined
  on_update?(value: T, obj: HasProps): void
}

export interface PropertyConstructor<T> {
  new (obj: HasProps, attr: string, kind: Kind<T>, default_value: DefaultFn<T>, options?: PropertyOptions<T>): Property<T>
  readonly prototype: Property<T>
}

export const unset = Symbol("unset")
export type Unset = typeof unset

export class UnsetValueError extends Error {}

export abstract class Property<T = unknown> {
  __value__: T

  get syncable(): boolean {
    return !this.internal
  }

  protected _value: T | Unset = unset

  get is_unset(): boolean {
    return this._value === unset
  }

  protected _initialized: boolean = false
  get initialized(): boolean {
    return this._initialized
  }

  initialize(initial_value: T | Unset = unset): void {
    if (this._initialized) {
      throw new Error("already initialized")
    }

    let attr_value: T | Unset = unset

    if (initial_value !== unset) {
      attr_value = initial_value
      this._dirty = true
    } else {
      const value = this._default_override()
      if (value !== unset) {
        attr_value = value
      } else {
        let themed = false
        if (global_theme != null) {
          const value = global_theme.get(this.obj, this.attr) as T | undefined
          if (value !== undefined) {
            attr_value = value
            themed = true
          }
        }

        if (!themed) {
          attr_value = this.default_value(this.obj)
        }
      }
    }

    if (attr_value !== unset) {
      if (this.kind.coerce != null) {
        attr_value = this.kind.coerce(attr_value) as T
      }
      this._update(attr_value)
    } else {
      this._value = unset
    }

    this._initialized = true
  }

  get_value(): T {
    if (this._value !== unset) {
      return this._value
    } else {
      throw new UnsetValueError(`${this.obj}.${this.attr} is unset`)
    }
  }

  set_value(val: T): void {
    if (!this._initialized) {
      this.initialize(val)
    } else {
      this._update(val)
      this._dirty = true
    }
    diagnostics.report(this)
  }

  // abstract _intrinsic_default(): T

  _default_override(): T | Unset {
    return unset
  }

  private _dirty: boolean = false
  get dirty(): boolean {
    return this._dirty
  }

  readonly may_have_refs: boolean

  readonly change: Signal0<HasProps>

  /*readonly*/ internal: boolean
  readonly: boolean

  convert?(value: T, obj: HasProps): T | undefined
  on_update?(value: T, obj: HasProps): void

  constructor(readonly obj: HasProps,
              readonly attr: string,
              readonly kind: Kind<T>,
              readonly default_value: DefaultFn<T>,
              options: PropertyOptions<T> = {}) {
    this.change = new Signal0(this.obj, "change")
    this.internal = options.internal ?? false
    this.readonly = options.readonly ?? false
    this.convert = options.convert
    this.on_update = options.on_update
    this.may_have_refs = kind.may_have_refs()
  }

  //protected abstract _update(attr_value: T): void

  protected _update(attr_value: T): void {
    this.validate(attr_value)
    if (this.convert != null) {
      const converted = this.convert(attr_value, this.obj)
      if (converted !== undefined) {
        attr_value = converted
      }
    }
    this._value = attr_value
    this.on_update?.(attr_value, this.obj)
  }

  toString(): string {
    /*${this.name}*/
    return `Prop(${this.obj}.${this.attr}, value: ${valueToString(this._value)})`
  }

  // ----- customizable policies

  normalize(values: any): any {
    return values
  }

  validate(value: unknown): void {
    if (!this.valid(value)) {
      throw new Error(`${this.obj}.${this.attr} given invalid value: ${valueToString(value)}`)
    }
  }

  valid(value: unknown): boolean {
    return this.kind.valid(value)
  }
}

export class PropertyAlias {
  constructor(readonly attr: string) {}
}
export function Alias(attr: string) {
  return new PropertyAlias(attr)
}

//
// Primitive Properties
//

export class PrimitiveProperty<T> extends Property<T> {}

export class Font extends PrimitiveProperty<string> {
  override _default_override(): string | Unset {
    return settings.dev ? "Bokeh" : unset
  }
}

//
// DataSpec properties
//

export abstract class ScalarSpec<T, S extends Scalar<T> = Scalar<T>> extends Property<T | S> {
  declare __value__: T
  __scalar__: S

  protected override _value: this["__scalar__"] | Unset = unset

  override get_value(): S {
    if (this._value !== unset) {
      return this._value
    } else {
      throw new Error(`${this.obj}.${this.attr} is unset`)
    }
  }

  protected override _update(attr_value: S | T): void {
    if (isSpec(attr_value)) {
      this._value = attr_value as S
    } else {
      this._value = {value: attr_value} as any // Value<T>
    }

    if (isPlainObject(this._value)) {
      const {_value} = this
      this._value[serialize] = (serializer) => {
        const {value, field, expr, transform, units} = _value as any
        return serializer.encode_struct((() => {
          if (value !== undefined) {
            return {type: "value", value, transform, units}
          } else if (field !== undefined) {
            return {type: "field", field, transform, units}
          } else {
            return {type: "expr", expr, transform, units}
          }
        })())
      }
    }

    if (isValue(this._value)) {
      this.validate(this._value.value)
    }
  }

  materialize(value: T): T {
    return value
  }

  scalar(value: T, n: number): UniformScalar<T> {
    return new UniformScalar(value, n)
  }

  uniform(source: ColumnarDataSource): UniformScalar<T/*T_out!!!*/> {
    const obj = this.get_value()
    const n = source.get_length() ?? 1
    if (isExpr(obj)) {
      const {expr, transform} = obj
      let result = (expr as ScalarExpression<T>).compute(source)
      if (transform != null) {
        result = transform.compute(result) as any
      }
      result = this.materialize(result)
      return this.scalar(result, n)
    } else {
      const {value, transform} = obj
      let result = value
      if (transform != null) {
        result = transform.compute(result)
      }
      result = this.materialize(result as any)
      return this.scalar(result, n)
    }
  }
}

/** @deprecated */
export class AnyScalar extends ScalarSpec<any> {}
export class DictScalar<T> extends ScalarSpec<Dict<T>> {}
export class ColorScalar extends ScalarSpec<types.Color | null> {}
export class NumberScalar extends ScalarSpec<number> {}
export class StringScalar extends ScalarSpec<string> {}
export class NullStringScalar extends ScalarSpec<string | null> {}
export class ArrayScalar extends ScalarSpec<any[]> {}
export class LineJoinScalar extends ScalarSpec<enums.LineJoin> {}
export class LineCapScalar extends ScalarSpec<enums.LineCap> {}
export class LineDashScalar extends ScalarSpec<enums.LineDash | number[]> {}
export class FontScalar extends ScalarSpec<string> {
  override _default_override(): string | Unset {
    return settings.dev ? "Bokeh" : unset
  }
}
export class FontSizeScalar extends ScalarSpec<string> {}
export class FontStyleScalar extends ScalarSpec<enums.FontStyle> {}
export class TextAlignScalar extends ScalarSpec<enums.TextAlign> {}
export class TextBaselineScalar extends ScalarSpec<enums.TextBaseline> {}

export abstract class VectorSpec<T, V extends Vector<T> = Vector<T>> extends Property<T | V> {
  declare __value__: T
  __vector__: V

  protected override _value: this["__vector__"] | Unset = unset

  override get_value(): V {
    if (this._value !== unset) {
      return this._value
    } else {
      throw new Error(`${this.obj}.${this.attr} is unset`)
    }
  }

  protected override _update(attr_value: V | T): void {
    if (isSpec(attr_value)) {
      this._value = attr_value as V
    } else {
      this._value = {value: attr_value} as any
    } // Value<T>

    if (isPlainObject(this._value)) {
      const {_value} = this
      this._value[serialize] = (serializer) => {
        const {value, field, expr, transform, units} = _value as any
        return serializer.encode_struct((() => {
          if (value !== undefined) {
            return {type: "value", value, transform, units}
          } else if (field !== undefined) {
            return {type: "field", field, transform, units}
          } else {
            return {type: "expr", expr, transform, units}
          }
        })())
      }
    }

    if (isValue(this._value)) {
      this.validate(this._value.value)
    }
  }

  materialize(value: T): T {
    return value
  }

  v_materialize(values: Arrayable<T>): Arrayable<T> {
    return values
  }

  scalar(value: T, n: number): UniformScalar<T> {
    return new UniformScalar(value, n)
  }

  vector(values: Arrayable<T>): UniformVector<T> {
    return new UniformVector(values)
  }

  uniform(source: ColumnarDataSource): Uniform<T/*T_out!!!*/> {
    const obj = this.get_value()
    const n = source.get_length() ?? 1
    if (isField(obj)) {
      const {field, transform} = obj
      let array = source.get_column(field)
      if (array != null) {
        if (transform != null) {
          array = transform.v_compute(array)
        }
        array = this.v_materialize(array)
        return this.vector(array)
      } else {
        const message = `attempted to retrieve property array for nonexistent field '${field}'`
        if (settings.force_fields) {
          throw new Error(message)
        } else {
          logger.warn(message)
        }
        return this.scalar(null as any, n)
      }
    } else if (isExpr(obj)) {
      const {expr, transform} = obj
      let array = (expr as VectorExpression<T>).v_compute(source)
      if (transform != null) {
        array = transform.v_compute(array) as any
      }
      array = this.v_materialize(array)
      return this.vector(array)
    } else if (isValue(obj)) {
      const {value, transform} = obj
      let result = value
      if (transform != null) {
        result = transform.compute(result)
      }
      result = this.materialize(result as any)
      return this.scalar(result, n)
    } else {
      unreachable()
    }
  }

  array(source: ColumnarDataSource): Arrayable<unknown> {
    let array: Arrayable

    const length = source.get_length() ?? 1

    const obj = this.get_value()
    if (isField(obj)) {
      const {field} = obj
      const column = source.get_column(field)
      if (column != null) {
        array = this.normalize(column)
      } else {
        const message = `attempted to retrieve property array for nonexistent field '${field}'`
        if (settings.force_fields) {
          throw new Error(message)
        } else {
          logger.warn(message)
        }
        const missing = new Float64Array(length)
        missing.fill(NaN)
        array = missing
      }
    } else if (isExpr(obj)) {
      const {expr} = obj
      array = this.normalize((expr as VectorExpression<T>).v_compute(source))
    } else {
      const value = this.normalize([obj.value])[0]
      if (isNumber(value)) {
        const values = new Float64Array(length)
        values.fill(value)
        array = values
      } else {
        array = repeat(value, length)
      }
    }

    const {transform} = obj
    if (transform != null) {
      array = transform.v_compute(array)
    }
    return array
  }
}

export abstract class DataSpec<T> extends VectorSpec<T> {}

export abstract class UnitsSpec<T, Units> extends VectorSpec<T, Dimensional<Vector<T>, Units>> {
  abstract get default_units(): Units
  abstract get valid_units(): Units[]

  protected override _value: this["__vector__"] | Unset = unset

  override _update(attr_value: any): void {
    super._update(attr_value)

    if (this._value !== unset) {
      const {units} = this._value
      if (units != null && !includes(this.valid_units, units)) {
        throw new Error(`units must be one of ${this.valid_units.join(", ")}; got: ${units}`)
      }
    }
  }

  get units(): Units {
    return this._value !== unset ? this._value.units ?? this.default_units : this.default_units
  }

  set units(units: Units) {
    if (this._value !== unset) {
      if (units != this.default_units) {
        this._value.units = units
      } else {
        delete this._value.units
      }
    } else {
      throw new Error(`${this.obj}.${this.attr} is unset`)
    }
  }
}

export abstract class NumberUnitsSpec<Units> extends UnitsSpec<number, Units> {
  override array(source: ColumnarDataSource): FloatArray {
    return new Float64Array(super.array(source) as Arrayable<number>)
  }
}

export abstract class BaseCoordinateSpec<T> extends DataSpec<T> {
  abstract get dimension(): "x" | "y"
}

export abstract class CoordinateSpec extends BaseCoordinateSpec<number | Factor> {}
export abstract class CoordinateSeqSpec extends BaseCoordinateSpec<Arrayable<number> | Arrayable<Factor>> {}
export abstract class CoordinateSeqSeqSeqSpec extends BaseCoordinateSpec<number[][][] | Factor[][][]> {}

export class XCoordinateSpec extends CoordinateSpec {
  readonly dimension = "x"
}
export class YCoordinateSpec extends CoordinateSpec {
  readonly dimension = "y"
}

export class XCoordinateSeqSpec extends CoordinateSeqSpec {
  readonly dimension = "x"
}
export class YCoordinateSeqSpec extends CoordinateSeqSpec {
  readonly dimension = "y"
}

export class XCoordinateSeqSeqSeqSpec extends CoordinateSeqSeqSeqSpec {
  readonly dimension = "x"
}
export class YCoordinateSeqSeqSeqSpec extends CoordinateSeqSeqSeqSpec {
  readonly dimension = "y"
}

export class AngleSpec extends NumberUnitsSpec<enums.AngleUnits> {
  get default_units(): enums.AngleUnits {
    return "rad"
  }
  get valid_units(): enums.AngleUnits[] {
    return [...enums.AngleUnits]
  }

  override materialize(value: number): number {
    const coeff = -to_radians_coeff(this.units)
    return value*coeff
  }

  override v_materialize(values: Arrayable<number>): Float32Array {
    const coeff = -to_radians_coeff(this.units)
    const result = new Float32Array(values.length)
    mul(values, coeff, result) // TODO: in-place?
    return result
  }

  override array(_source: ColumnarDataSource): Float32Array {
    throw new Error("not supported")
  }
}

export class DistanceSpec extends NumberUnitsSpec<enums.SpatialUnits> {
  get default_units(): enums.SpatialUnits {
    return "data"
  }
  get valid_units(): enums.SpatialUnits[] {
    return [...enums.SpatialUnits]
  }
}

export class NullDistanceSpec extends DistanceSpec { // TODO: T = number | null
  override materialize(value: number | null): number {
    return value ?? NaN
  }
}

export class BooleanSpec extends DataSpec<boolean> {
  override v_materialize(values: Arrayable<boolean>): Arrayable<boolean> /* Uint8Array */ {
    return new Uint8Array(values as any) as any
  }

  override array(source: ColumnarDataSource): Uint8Array {
    return new Uint8Array(super.array(source) as any)
  }
}

export class IntSpec extends DataSpec<number> {
  override v_materialize(values: Arrayable<number>): TypedArray {
    return isTypedArray(values) ? values : new Int32Array(values)
  }

  override array(source: ColumnarDataSource): IntArray {
    return new Int32Array(super.array(source) as Arrayable<number>)
  }
}

export class NumberSpec extends DataSpec<number> {
  override v_materialize(values: Arrayable<number>): TypedArray {
    return isTypedArray(values) ? values : new Float64Array(values)
  }

  override array(source: ColumnarDataSource): FloatArray {
    return new Float64Array(super.array(source) as Arrayable<number>)
  }
}

export class ScreenSizeSpec extends NumberSpec {
  override valid(value: unknown): boolean {
    return isNumber(value) && value >= 0
  }
}

export class ColorSpec extends DataSpec<types.Color | null> {
  override materialize(color: types.Color | null): uint32 {
    return encode_rgba(color2rgba(color))
  }

  override v_materialize(colors: Arrayable<types.Color | null> | NDArray): ColorArray {
    if (is_NDArray(colors)) {
      if (colors.dtype == "uint32" && colors.dimension == 1) {
        return to_big_endian(colors)
      } else if (colors.dtype == "uint8" && colors.dimension == 1) {
        const [n] = colors.shape
        const array = new RGBAArray(4*n)
        let j = 0
        for (const gray of colors) {
          array[j++] = gray
          array[j++] = gray
          array[j++] = gray
          array[j++] = 255
        }
        return new ColorArray(array.buffer)
      } else if (colors.dtype == "uint8" && colors.dimension == 2) {
        const [n, d] = colors.shape
        if (d == 4) {
          return new ColorArray(colors.buffer)
        } else if (d == 3) {
          const array = new RGBAArray(4*n)
          for (let i = 0, j = 0; i < d*n;) {
            array[j++] = colors[i++]
            array[j++] = colors[i++]
            array[j++] = colors[i++]
            array[j++] = 255
          }
          return new ColorArray(array.buffer)
        }
      } else if ((colors.dtype == "float32" || colors.dtype == "float64") && colors.dimension == 2) {
        const [n, d] = colors.shape
        if (d == 3 || d == 4) {
          const array = new RGBAArray(4*n)
          for (let i = 0, j = 0; i < d*n;) {
            array[j++] = colors[i++]*255
            array[j++] = colors[i++]*255
            array[j++] = colors[i++]*255
            array[j++] = (d == 3 ? 1 : colors[i++])*255
          }
          return new ColorArray(array.buffer)
        }
      } else if (colors.dtype == "object" && colors.dimension == 1) {
        return this._from_css_array(colors as NDArrayType<types.Color | null>)
      }
    } else {
      return this._from_css_array(colors)
    }

    throw new Error("invalid color array")
  }

  protected _from_css_array(colors: Arrayable<types.Color | null>): ColorArray {
    const n = colors.length
    const array = new RGBAArray(4*n)

    let j = 0
    for (const color of colors) {
      const [r, g, b, a] = color2rgba(color)
      array[j++] = r
      array[j++] = g
      array[j++] = b
      array[j++] = a
    }

    return new ColorArray(array.buffer)
  }

  override vector(values: ColorArray): ColorUniformVector {
    return new ColorUniformVector(values)
  }
}

export class NDArraySpec extends DataSpec<NDArrayType<number>> {}

/** @deprecated */
export class AnySpec extends DataSpec<any> {}
export class StringSpec extends DataSpec<string> {}
export class NullStringSpec extends DataSpec<string | null> {}
export class ArraySpec extends DataSpec<any[]> {}

export const ExtMarkerType = PrefixedStr("@")
export type ExtMarkerType = typeof ExtMarkerType["__type__"]

export class MarkerSpec extends DataSpec<enums.MarkerType | ExtMarkerType | null> {}
export class LineJoinSpec extends DataSpec<enums.LineJoin> {}
export class LineCapSpec extends DataSpec<enums.LineCap> {}
export class LineDashSpec extends DataSpec<enums.LineDash | number[]> {}
export class FontSpec extends DataSpec<string> {
  override _default_override(): string | Unset {
    return settings.dev ? "Bokeh" : unset
  }
}
export class FontSizeSpec extends DataSpec<string> {}
export class FontStyleSpec extends DataSpec<enums.FontStyle> {}
export class TextAlignSpec extends DataSpec<enums.TextAlign> {}
export class TextBaselineSpec extends DataSpec<enums.TextBaseline> {}
