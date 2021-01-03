import {Signal0} from "./signaling"
import {logger} from "./logging"
import type {HasProps} from "./has_props"
import * as enums from "./enums"
import {Arrayable, NumberArray, RGBAArray, ColorArray} from "./types"
import * as types from "./types"
import {includes, repeat} from "./util/array"
import {mul} from "./util/arrayable"
import {to_radians_coeff} from "./util/math"
import {is_Color, color2rgba} from "./util/color"
import {to_big_endian} from "./util/platform"
import {isBoolean, isNumber, isString, isArray, isPlainObject} from "./util/types"
import {Factor/*, OffsetFactor*/} from "../models/ranges/factor_range"
import {ColumnarDataSource} from "../models/sources/columnar_data_source"
import {Scalar, Vector, Dimensional} from "./vectorization"
import {settings} from "./settings"
import {Kind} from "./kinds"
import {is_NDArray, NDArray} from "./util/ndarray"

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

export type Spec = {
  readonly value?: any
  readonly field?: string
  readonly expr?: any
  readonly transform?: any // Transform
}

//
// Property base class
//

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
  optional?: boolean
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

  /*protected*/ spec: Spec // XXX: too many failures for now

  get_value(): T {
    return this.spec.value
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
  readonly optional: boolean

  on_update?(value: T, obj: HasProps): void

  constructor(readonly obj: HasProps,
              readonly attr: string,
              readonly kind: Kind<T>,
              readonly default_value?: (obj: HasProps) => T,
              initial_value?: T,
              options: PropertyOptions<T> = {}) {
    this.change = new Signal0(this.obj, "change")

    this.internal = options.internal ?? false
    this.optional = options.optional ?? false
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
        this.spec = {value: null}
        return
      }
    }

    this._update(attr_value)
  }

  //protected abstract _update(attr_value: T): void

  protected _update(attr_value: T): void {
    this.validate(attr_value)
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

  value(do_spec_transform: boolean = true): any {
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
  valid(value: unknown): boolean {
    return isArray(value) || value instanceof Float32Array || value instanceof Float64Array
  }
}

/** @deprecated */
export class Boolean extends Property<boolean> {
  valid(value: unknown): boolean {
    return isBoolean(value)
  }
}

/** @deprecated */
export class Color extends Property<types.Color> {
  valid(value: unknown): boolean {
    return is_Color(value)
  }
}

/** @deprecated */
export class Instance extends Property<any /*HasProps*/> {
  //valid(value: unknown): boolean { return  value.properties != null }
}

/** @deprecated */
export class Number extends Property<number> {
  valid(value: unknown): boolean {
    return isNumber(value)
  }
}

/** @deprecated */
export class Int extends Number {
  valid(value: unknown): boolean {
    return isNumber(value) && (value | 0) == value
  }
}

/** @deprecated */
export class Angle extends Number {}

/** @deprecated */
export class Percent extends Number {
  valid(value: unknown): boolean {
    return isNumber(value) && 0 <= value && value <= 1.0
  }
}

/** @deprecated */
export class String extends Property<string> {
  valid(value: unknown): boolean {
    return isString(value)
  }
}

/** @deprecated */
export class NullString extends Property<string | null> {
  valid(value: unknown): boolean {
    return value === null || isString(value)
  }
}

/** @deprecated */
export class FontSize extends String {}

/** @deprecated */
export class Font extends String {
  _default_override(): string | undefined {
    return settings.dev ? "Bokeh" : undefined
  }
}

//
// Enum properties
//

/** @deprecated */
export abstract class EnumProperty<T extends string> extends Property<T> {
  abstract get enum_values(): T[]

  valid(value: unknown): boolean {
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

  normalize(values: any): any {
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
  __value__: T
  __scalar__: S

  get_value(): S {
    // XXX: allow obj.x = null; obj.x == null
    return this.spec.value === null ? null : this.spec as any
  }

  protected _update(attr_value: S | T): void {
    if (isSpec(attr_value))
      this.spec = attr_value
    else
      this.spec = {value: attr_value}

    if (this.spec.value != null)
      this.validate(this.spec.value)
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
export class FontSizeScalar extends ScalarSpec<string> {}
export class FontStyleScalar extends ScalarSpec<enums.FontStyle> {}
export class TextAlignScalar extends ScalarSpec<enums.TextAlign> {}
export class TextBaselineScalar extends ScalarSpec<enums.TextBaseline> {}

export abstract class VectorSpec<T, V extends Vector<T> = Vector<T>> extends Property<T | V> {
  __value__: T
  __vector__: V

  get_value(): V {
    // XXX: allow obj.x = null; obj.x == null
    return this.spec.value === null ? null : this.spec as any
  }

  protected _update(attr_value: V | T): void {
    if (isSpec(attr_value))
      this.spec = attr_value
    else
      this.spec = {value: attr_value}

    if (this.spec.value != null)
      this.validate(this.spec.value)
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
        const missing = new NumberArray(length)
        missing.fill(NaN)
        array = missing
      }
    } else if (this.spec.expr != null) {
      array = this.normalize(this.spec.expr.v_compute(source))
    } else {
      const value = this.value(false) // don't apply any spec transform
      if (isNumber(value)) {
        const values = new NumberArray(length)
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

  spec: Spec & {units?: Units}

  _update(attr_value: any): void {
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
  array(source: ColumnarDataSource): NumberArray {
    return new NumberArray(super.array(source) as any)
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
  get default_units(): enums.AngleUnits { return "rad" as "rad" }
  get valid_units(): enums.AngleUnits[] { return [...enums.AngleUnits] }

  normalize(values: Arrayable): Arrayable {
    const coeff = -to_radians_coeff(this.units)
    mul(values, coeff, values)
    return super.normalize(values)
  }
}

export class DistanceSpec extends NumberUnitsSpec<enums.SpatialUnits> {
  get default_units(): enums.SpatialUnits { return "data" as "data" }
  get valid_units(): enums.SpatialUnits[] { return [...enums.SpatialUnits] }
}

export class ScreenDistanceSpec extends DistanceSpec {
  get default_units(): enums.SpatialUnits { return "screen" as "screen" }
}

export class BooleanSpec extends DataSpec<boolean> {
  array(source: ColumnarDataSource): Uint8Array {
    return new Uint8Array(super.array(source) as any)
  }
}

export class NumberSpec extends DataSpec<number> {
  array(source: ColumnarDataSource): NumberArray {
    return new NumberArray(super.array(source) as any)
  }
}

export class ColorSpec extends DataSpec<types.Color | null> {
  array(source: ColumnarDataSource): ColorArray {
    const colors = super.array(source) as Arrayable<types.Color | null>

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
}

export class FontSizeSpec extends DataSpec<string> {}

export class MarkerSpec extends DataSpec<enums.MarkerType> {}

export class StringSpec extends DataSpec<string> {}

export class NullStringSpec extends DataSpec<string | null> {}

export class NDArraySpec extends DataSpec<NDArray> {}
