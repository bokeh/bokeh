import {Signal0} from "./signaling"
import {logger} from "./logging"
import type {HasProps} from "./has_props"
import * as enums from "./enums"
import {Arrayable, IntArray, FloatArray, TypedArray, RGBAArray, ColorArray, uint32} from "./types"
import * as types from "./types"
import {includes, repeat} from "./util/array"
import {mul} from "./util/arrayable"
import {to_radians_coeff} from "./util/math"
import {is_Color, color2rgba, encode_rgba} from "./util/color"
import {to_big_endian} from "./util/platform"
import {isBoolean, isNumber, isString, isArray, isTypedArray, isPlainObject} from "./util/types"
import {Factor/*, OffsetFactor*/} from "../models/ranges/factor_range"
import {ColumnarDataSource} from "../models/sources/columnar_data_source"
import {Scalar, Vector, Dimensional, Transform, Expression, ScalarExpression, VectorExpression} from "./vectorization"
import {settings} from "./settings"
import {Kind} from "./kinds"
import {is_NDArray, NDArray} from "./util/ndarray"

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

export type Spec<T> = {
  readonly value?: T
  readonly field?: string
  readonly expr?: Expression<T>
  readonly transform?: Transform<unknown, T>
}

//
// Property base class
//

export type UniformsOf<M> = {
  [K in keyof M]: M[K] extends VectorSpec<infer T, any> ? Uniform<T>       :
                  M[K] extends ScalarSpec<infer T, any> ? UniformScalar<T> :
                  M[K] extends Property<infer T>        ? T                : never
}

export type AttrsOf<P> = {
  [K in keyof P]: P[K] extends Property<infer T> ? T : never
}

export type DefineOf<P> = {
  [K in keyof P]: P[K] extends Property<infer T> ? [PropertyConstructor<T> | PropertyAlias | Kind<T>, (T | ((obj: HasProps) => T))?, PropertyOptions<T>?] : never
}

export type DefaultsOf<P> = {
  [K in keyof P]: P[K] extends Property<infer T> ? T | ((obj: HasProps) => T) : never
}

export type PropertyOptions<T> = {
  internal?: boolean
  convert?(value: T): T | undefined
  on_update?(value: T, obj: HasProps): void
}

export interface PropertyConstructor<T> {
  new (obj: HasProps, attr: string, kind: Kind<T>, default_value?: (obj: HasProps) => T, initial_value?: T, options?: PropertyOptions<T>): Property<T>
  readonly prototype: Property<T>
}

export abstract class Property<T = unknown> {
  __value__: T

  get is_value(): boolean {
    return this.spec.value !== undefined
  }

  get syncable(): boolean {
    return !this.internal
  }

  protected spec: Spec<T>

  get_value(): T {
    return this.spec.value!
  }

  set_value(val: T): void {
    this._update(val)
    this._dirty = true
  }

  // abstract _intrinsic_default(): T

  _default_override(): T | undefined {
    return undefined
  }

  private _dirty: boolean = false
  get dirty(): boolean {
    return this._dirty
  }

  readonly change: Signal0<HasProps>

  /*readonly*/ internal: boolean

  convert?(value: T): T | undefined
  on_update?(value: T, obj: HasProps): void

  constructor(readonly obj: HasProps,
              readonly attr: string,
              readonly kind: Kind<T>,
              readonly default_value?: (obj: HasProps) => T,
              initial_value?: T,
              options: PropertyOptions<T> = {}) {
    this.change = new Signal0(this.obj, "change")

    this.internal = options.internal ?? false
    this.convert = options.convert
    this.on_update = options.on_update

    let attr_value: T
    if (initial_value !== undefined) {
      attr_value = initial_value
      this._dirty = true
    } else {
      const value = this._default_override()
      if (value !== undefined)
        attr_value = value
      else if (default_value !== undefined)
        attr_value = default_value(obj)
      else {
        // XXX: temporary and super sketchy, but affects only "readonly" and a few internal properties
        // console.warn(`${this.obj}.${this.attr} has no value nor default`)
        this.spec = {value: null as any}
        return
      }
    }

    this._update(attr_value)
  }

  //protected abstract _update(attr_value: T): void

  protected _update(attr_value: T): void {
    this.validate(attr_value)
    if (this.convert != null) {
      const converted = this.convert(attr_value)
      if (converted !== undefined)
        attr_value = converted
    }
    this.spec = {value: attr_value}
    this.on_update?.(attr_value, this.obj)
  }

  toString(): string {
    /*${this.name}*/
    return `Prop(${this.obj}.${this.attr}, spec: ${valueToString(this.spec)})`
  }

  // ----- customizable policies

  normalize(values: any): any {
    return values
  }

  validate(value: unknown): void {
    if (!this.valid(value))
      throw new Error(`${this.obj}.${this.attr} given invalid value: ${valueToString(value)}`)
  }

  valid(value: unknown): boolean {
    return this.kind.valid(value)
  }

  // ----- property accessors

  _value(do_spec_transform: boolean = true): any {
    if (!this.is_value)
      throw new Error("attempted to retrieve property value for property without value specification")
    let ret = this.normalize([this.spec.value])[0]
    if (this.spec.transform != null && do_spec_transform)
      ret = this.spec.transform.compute(ret)
    return ret
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

/** @deprecated */
export class Any extends Property<any> {}

/** @deprecated */
export class Array extends Property<any[]> {
  override valid(value: unknown): boolean {
    return isArray(value) || isTypedArray(value)
  }
}

/** @deprecated */
export class Boolean extends Property<boolean> {
  override valid(value: unknown): boolean {
    return isBoolean(value)
  }
}

/** @deprecated */
export class Color extends Property<types.Color> {
  override valid(value: unknown): boolean {
    return is_Color(value)
  }
}

/** @deprecated */
export class Instance extends Property<any /*HasProps*/> {
  //override valid(value: unknown): boolean { return  value.properties != null }
}

/** @deprecated */
export class Number extends Property<number> {
  override valid(value: unknown): boolean {
    return isNumber(value)
  }
}

/** @deprecated */
export class Int extends Number {
  override valid(value: unknown): boolean {
    return isNumber(value) && (value | 0) == value
  }
}

/** @deprecated */
export class Angle extends Number {}

/** @deprecated */
export class Percent extends Number {
  override valid(value: unknown): boolean {
    return isNumber(value) && 0 <= value && value <= 1.0
  }
}

/** @deprecated */
export class String extends Property<string> {
  override valid(value: unknown): boolean {
    return isString(value)
  }
}

/** @deprecated */
export class NullString extends Property<string | null> {
  override valid(value: unknown): boolean {
    return value === null || isString(value)
  }
}

/** @deprecated */
export class FontSize extends String {}

/** @deprecated */
export class Font extends String {
  override _default_override(): string | undefined {
    return settings.dev ? "Bokeh" : undefined
  }
}

//
// Enum properties
//

/** @deprecated */
export abstract class EnumProperty<T extends string> extends Property<T> {
  abstract get enum_values(): T[]

  override valid(value: unknown): boolean {
    return isString(value) && includes(this.enum_values, value)
  }
}

/** @deprecated */
export function Enum<T extends string>(values: Iterable<T>): PropertyConstructor<T> {
  return class extends EnumProperty<T> {
    get enum_values(): T[] {
      return [...values]
    }
  }
}

export class Direction extends EnumProperty<enums.Direction> {
  get enum_values(): enums.Direction[] {
    return [...enums.Direction]
  }

  override normalize(values: any): any {
    const result = new Uint8Array(values.length)
    for (let i = 0; i < values.length; i++) {
      switch (values[i]) {
        case "clock":     result[i] = 0; break
        case "anticlock": result[i] = 1; break
      }
    }
    return result
  }
}

/** @deprecated */ export const Anchor = Enum(enums.Anchor)
/** @deprecated */ export const AngleUnits = Enum(enums.AngleUnits)
/** @deprecated */ export const BoxOrigin = Enum(enums.BoxOrigin)
/** @deprecated */ export const ButtonType = Enum(enums.ButtonType)
/** @deprecated */ export const CalendarPosition = Enum(enums.CalendarPosition)
/** @deprecated */ export const Dimension = Enum(enums.Dimension)
/** @deprecated */ export const Dimensions = Enum(enums.Dimensions)
/** @deprecated */ export const Distribution = Enum(enums.Distribution)
/** @deprecated */ export const FontStyle = Enum(enums.FontStyle)
/** @deprecated */ export const HatchPatternType = Enum(enums.HatchPatternType)
/** @deprecated */ export const HTTPMethod = Enum(enums.HTTPMethod)
/** @deprecated */ export const HexTileOrientation = Enum(enums.HexTileOrientation)
/** @deprecated */ export const HoverMode = Enum(enums.HoverMode)
/** @deprecated */ export const LatLon = Enum(enums.LatLon)
/** @deprecated */ export const LegendClickPolicy = Enum(enums.LegendClickPolicy)
/** @deprecated */ export const LegendLocation = Enum(enums.LegendLocation)
/** @deprecated */ export const LineCap = Enum(enums.LineCap)
/** @deprecated */ export const LineJoin = Enum(enums.LineJoin)
/** @deprecated */ export const LinePolicy = Enum(enums.LinePolicy)
/** @deprecated */ export const Location = Enum(enums.Location)
/** @deprecated */ export const Logo = Enum(enums.Logo)
/** @deprecated */ export const MarkerType = Enum(enums.MarkerType)
/** @deprecated */ export const MutedPolicy = Enum(enums.MutedPolicy)
/** @deprecated */ export const Orientation = Enum(enums.Orientation)
/** @deprecated */ export const OutputBackend = Enum(enums.OutputBackend)
/** @deprecated */ export const PaddingUnits = Enum(enums.PaddingUnits)
/** @deprecated */ export const Place = Enum(enums.Place)
/** @deprecated */ export const PointPolicy = Enum(enums.PointPolicy)
/** @deprecated */ export const RadiusDimension = Enum(enums.RadiusDimension)
/** @deprecated */ export const RenderLevel = Enum(enums.RenderLevel)
/** @deprecated */ export const RenderMode = Enum(enums.RenderMode)
/** @deprecated */ export const ResetPolicy = Enum(enums.ResetPolicy)
/** @deprecated */ export const RoundingFunction = Enum(enums.RoundingFunction)
/** @deprecated */ export const Side = Enum(enums.Side)
/** @deprecated */ export const SizingMode = Enum(enums.SizingMode)
/** @deprecated */ export const Sort = Enum(enums.Sort)
/** @deprecated */ export const SpatialUnits = Enum(enums.SpatialUnits)
/** @deprecated */ export const StartEnd = Enum(enums.StartEnd)
/** @deprecated */ export const StepMode = Enum(enums.StepMode)
/** @deprecated */ export const TapBehavior = Enum(enums.TapBehavior)
/** @deprecated */ export const TextAlign = Enum(enums.TextAlign)
/** @deprecated */ export const TextBaseline = Enum(enums.TextBaseline)
/** @deprecated */ export const TextureRepetition = Enum(enums.TextureRepetition)
/** @deprecated */ export const TickLabelOrientation = Enum(enums.TickLabelOrientation)
/** @deprecated */ export const TooltipAttachment = Enum(enums.TooltipAttachment)
/** @deprecated */ export const UpdateMode = Enum(enums.UpdateMode)
/** @deprecated */ export const VerticalAlign = Enum(enums.VerticalAlign)

//
// DataSpec properties
//

export class ScalarSpec<T, S extends Scalar<T> = Scalar<T>> extends Property<T | S> {
  override __value__: T
  __scalar__: S

  override get_value(): S {
    // XXX: denormalize value for serialization, because bokeh doens't support scalar properties
    const {value, expr, transform} = this.spec
    return (expr != null || transform != null ? this.spec : value) as any
    // XXX: allow obj.x = null; obj.x == null
    // return this.spec.value === null ? null : this.spec as any
  }

  protected override _update(attr_value: S | T): void {
    if (isSpec(attr_value))
      this.spec = attr_value
    else
      this.spec = {value: attr_value}

    if (this.spec.value != null)
      this.validate(this.spec.value)
  }

  materialize(value: T): T {
    return value
  }

  scalar(value: T, n: number): UniformScalar<T> {
    return new UniformScalar(value, n)
  }

  uniform(source: ColumnarDataSource): UniformScalar<T/*T_out!!!*/> {
    const {expr, value, transform} = this.spec
    const n = source.get_length() ?? 1
    if (expr != null) {
      let result = (expr as ScalarExpression<T>).compute(source)
      if (transform != null)
        result = transform.compute(result) as any
      result = this.materialize(result)
      return this.scalar(result, n)
    } else {
      let result = value
      if (transform != null)
        result = transform.compute(result)
      result = this.materialize(result as any)
      return this.scalar(result, n)
    }
  }
}

export class AnyScalar extends ScalarSpec<any> {}
export class ColorScalar extends ScalarSpec<types.Color | null> {}
export class NumberScalar extends ScalarSpec<number> {}
export class StringScalar extends ScalarSpec<string> {}
export class NullStringScalar extends ScalarSpec<string | null> {}
export class ArrayScalar extends ScalarSpec<any[]> {}
export class LineJoinScalar extends ScalarSpec<enums.LineJoin> {}
export class LineCapScalar extends ScalarSpec<enums.LineCap> {}
export class LineDashScalar extends ScalarSpec<enums.LineDash | number[]> {}
export class FontScalar extends ScalarSpec<string> {
  override _default_override(): string | undefined {
    return settings.dev ? "Bokeh" : undefined
  }
}
export class FontSizeScalar extends ScalarSpec<string> {}
export class FontStyleScalar extends ScalarSpec<enums.FontStyle> {}
export class TextAlignScalar extends ScalarSpec<enums.TextAlign> {}
export class TextBaselineScalar extends ScalarSpec<enums.TextBaseline> {}

export abstract class VectorSpec<T, V extends Vector<T> = Vector<T>> extends Property<T | V> {
  override __value__: T
  __vector__: V

  override get_value(): V {
    // XXX: allow obj.x = null; obj.x == null
    return this.spec.value === null ? null : this.spec as any
  }

  protected override _update(attr_value: V | T): void {
    if (isSpec(attr_value))
      this.spec = attr_value
    else
      this.spec = {value: attr_value}

    if (this.spec.value != null)
      this.validate(this.spec.value)
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
    const {field, expr, value, transform} = this.spec
    const n = source.get_length() ?? 1
    if (field != null) {
      let array = source.get_column(field)
      if (array != null) {
        if (transform != null)
          array = transform.v_compute(array)
        array = this.v_materialize(array)
        return this.vector(array)
      } else {
        logger.warn(`attempted to retrieve property array for nonexistent field '${field}'`)
        return this.scalar(null as any, n)
      }
    } else if (expr != null) {
      let array = (expr as VectorExpression<T>).v_compute(source)
      if (transform != null)
        array = transform.v_compute(array) as any
      array = this.v_materialize(array)
      return this.vector(array)
    } else {
      let result = value
      if (transform != null)
        result = transform.compute(result)
      result = this.materialize(result as any)
      return this.scalar(result, n)
    }
  }

  array(source: ColumnarDataSource): Arrayable<unknown> {
    let array: Arrayable

    const length = source.get_length() ?? 1

    if (this.spec.field != null) {
      const column = source.get_column(this.spec.field)
      if (column != null)
        array = this.normalize(column)
      else {
        logger.warn(`attempted to retrieve property array for nonexistent field '${this.spec.field}'`)
        const missing = new Float64Array(length)
        missing.fill(NaN)
        array = missing
      }
    } else if (this.spec.expr != null) {
      array = this.normalize((this.spec.expr as VectorExpression<T>).v_compute(source))
    } else {
      const value = this._value(false) // don't apply any spec transform
      if (isNumber(value)) {
        const values = new Float64Array(length)
        values.fill(value)
        array = values
      } else
        array = repeat(value, length)
    }

    if (this.spec.transform != null)
      array = this.spec.transform.v_compute(array)
    return array
  }
}

export abstract class DataSpec<T> extends VectorSpec<T> {}

export abstract class UnitsSpec<T, Units> extends VectorSpec<T, Dimensional<Vector<T>, Units>> {
  abstract get default_units(): Units
  abstract get valid_units(): Units[]

  override spec: Spec<T> & {units?: Units}

  override _update(attr_value: any): void {
    super._update(attr_value)

    const {units} = this.spec
    if (units != null && !includes(this.valid_units, units)) {
      throw new Error(`units must be one of ${this.valid_units.join(", ")}; got: ${units}`)
    }
  }

  get units(): Units {
    return this.spec.units ?? this.default_units
  }

  set units(units: Units) {
    if (units != this.default_units)
      this.spec.units = units
    else
      delete this.spec.units
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

export class XCoordinateSpec extends CoordinateSpec { readonly dimension = "x" }
export class YCoordinateSpec extends CoordinateSpec { readonly dimension = "y" }

export class XCoordinateSeqSpec extends CoordinateSeqSpec { readonly dimension = "x" }
export class YCoordinateSeqSpec extends CoordinateSeqSpec { readonly dimension = "y" }

export class XCoordinateSeqSeqSeqSpec extends CoordinateSeqSeqSeqSpec { readonly dimension = "x" }
export class YCoordinateSeqSeqSeqSpec extends CoordinateSeqSeqSeqSpec { readonly dimension = "y" }

export class AngleSpec extends NumberUnitsSpec<enums.AngleUnits> {
  get default_units(): enums.AngleUnits { return "rad" }
  get valid_units(): enums.AngleUnits[] { return [...enums.AngleUnits] }

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
  get default_units(): enums.SpatialUnits { return "data" }
  get valid_units(): enums.SpatialUnits[] { return [...enums.SpatialUnits] }
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

  override v_materialize(colors: Arrayable<types.Color | null>): ColorArray {
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
      }
    } else {
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

    throw new Error("invalid color array")
  }

  override vector(values: ColorArray): ColorUniformVector {
    return new ColorUniformVector(values)
  }
}

export class NDArraySpec extends DataSpec<NDArray> {}

export class AnySpec extends DataSpec<any> {}
export class StringSpec extends DataSpec<string> {}
export class NullStringSpec extends DataSpec<string | null> {}
export class ArraySpec extends DataSpec<any[]> {}

export class MarkerSpec extends DataSpec<enums.MarkerType> {}
export class LineJoinSpec extends DataSpec<enums.LineJoin> {}
export class LineCapSpec extends DataSpec<enums.LineCap> {}
export class LineDashSpec extends DataSpec<enums.LineDash | number[]> {}
export class FontSpec extends DataSpec<string> {
  override _default_override(): string | undefined {
    return settings.dev ? "Bokeh" : undefined
  }
}
export class FontSizeSpec extends DataSpec<string> {}
export class FontStyleSpec extends DataSpec<enums.FontStyle> {}
export class TextAlignSpec extends DataSpec<enums.TextAlign> {}
export class TextBaselineSpec extends DataSpec<enums.TextBaseline> {}
