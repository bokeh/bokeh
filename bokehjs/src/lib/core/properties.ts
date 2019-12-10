import {Signal0} from "./signaling"
import /*type*/ {HasProps} from "./has_props"
import * as enums from "./enums"
import {Arrayable, Color as ColorType} from "./types"
import {includes, repeat} from "./util/array"
import {map} from "./util/arrayable"
import {is_color} from "./util/color"
import {isBoolean, isNumber, isString, isArray, isObject, isPlainObject} from "./util/types"
import {Factor/*, OffsetFactor*/} from "../models/ranges/factor_range"
import {ColumnarDataSource} from "../models/sources/columnar_data_source"
import {Scalar, Vector, Dimensional, is_Value, is_Field, is_Expr} from "./vectorization"

/**
 *  Type, Value, N
 *
 *  Property<number, number>
 *   - update(val: number)
 *   - value(): number
 *   - scalar(): number
 *
 *  ScalarSpec<number, Scalar<number>>
 *   - update(val: number | Scalar<number>)
 *   - value(): Scalar<number>
 *   - scalar(): number
 *
 *  VectorSpec<number, Vector<number>>
 *   - update(val: number | Vector<number>)
 *   - value(): Vector<number>
 *   - scalar(): number
 *   - vector(source): Arrayable<number>
 *
 *  Type :: value type    e.g. number
 *  Value :: value spec    e.g. Value<number>
 *  Normal :: value normal  e.g. 0 | 1
 *
 *  Property<Type, Value = Type, N = Type>
 *   - update(val: Type | Value)
 *   - value(): Value
 *   - scalar(): N
 *
 *  ScalarSpec<Type, Value = Scalar<Type>, N = Type>
 *   - update(val: Type | Value)
 *   - value(): Value
 *   - scalar(): N
 *
 *  VectorSpec<Type, Value = Vector<Type>, N = Type>
 *   - update(val: Type | Value)
 *   - value(): Value
 *   - scalar(): N
 *   - vector(source): Arrayable<N>
 */

function safe_to_string(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return `${value}`
  }
}

export type AttrsOf<P> = {
  [K in keyof P]: P[K] extends Property<infer T, any> ? T : never
}

export type DefineOf<P> = {
  [K in keyof P]: P[K] extends Property<infer T, infer N> ? [PropertyConstructor<T, N>, (T | (() => T))?, PropertyOptions?]: never
}

export type PropertyOptions = {
  internal?: boolean
  optional?: boolean
}

export interface PropertyConstructor<T, N> {
  new (obj: HasProps, attr: string, default_value?: (obj: HasProps) => T, initial_value?: T, options?: PropertyOptions): Property<T>
  readonly prototype: Property<T, N>
}

export abstract class Property<Type, Value = Type, N = Type> {
  __type__: Type
  __value__: Value
  __normal__: N

  /*
  spec: {
    readonly value?: any
    readonly field?: string
    readonly expr?: any
    readonly transform?: any // Transform
    units?: any
  }
  */

  protected _value: Value
  get_value(): Value {
    return this._value
  }

  set_value(val: Type | Value): void {
    this._update(val)
    this._dirty = true
  }

  private _dirty: boolean = false
  get dirty(): boolean {
    return this._dirty
  }

  readonly change: Signal0<HasProps>

  readonly internal: boolean
  readonly optional: boolean

  constructor(readonly obj: HasProps,
              readonly attr: string,
              readonly default_value?: (obj: HasProps) => Type | Value,
              initial_value?: Type | Value,
              options: PropertyOptions = {}) {
    this.change = new Signal0(this.obj, "change")

    this.internal = options.internal ?? false
    this.optional = options.optional ?? false

    let attr_value: Type | Value
    if (initial_value !== undefined) {
      attr_value = initial_value
      this._dirty = true
    } else {
      if (default_value !== undefined)
        attr_value = default_value(obj)
      else
        //throw new Error("no default")
        attr_value = null as any // XXX: nullable properties
    }

    this._update(attr_value)
  }

  toString(): string {
    return `Prop(${this.obj}.${this.attr}, ${safe_to_string(this._value)})`
  }

  protected abstract _update(attr_value: Type | Value): void

  abstract valid(value: unknown): boolean

  abstract scalar(): N

  protected normalize(value: Type): N {
    return value as any // XXX
  }

  validate(value: unknown): void {
    if (!this.valid(value))
      throw new Error(`${this.obj.type}.${this.attr} given invalid value: ${safe_to_string(value)}`)
  }
}

//
// Primitive Properties
//

export abstract class Primitive<Type, N = Type> extends Property<Type, Type, N> {
  _update(value: Type): void {
    this.validate(value)
    this._value = value
  }

  scalar(): N {
    return this.normalize(this.get_value())
  }
}

export class Any extends Primitive<any> {
  valid(_value: unknown): boolean {
    return true
  }
}

export class Array extends Primitive<any[]> {
  valid(value: unknown): boolean {
    return isArray(value) || value instanceof Float64Array
  }
}

export class Boolean extends Primitive<boolean> {
  valid(value: unknown): boolean {
    return isBoolean(value)
  }
}

export class Color extends Primitive<ColorType> {
  valid(value: unknown): boolean {
    return isString(value) && is_color(value)
  }
}

export class Instance extends Primitive<any /*HasProps*/> {
  valid(value: unknown): boolean {
    return isObject(value) && "properties" in value
  }
}

export class Number extends Primitive<number> {
  valid(value: unknown): boolean {
    return isNumber(value)
  }
}

export class Int extends Number {
  valid(value: unknown): boolean {
    return isNumber(value) && (value | 0) == value
  }
}

export class Angle extends Number {}

export class Percent extends Number {
  valid(value: unknown): boolean {
    return isNumber(value) && 0 <= value && value <= 1.0
  }
}

export class String extends Primitive<string> {
  valid(value: unknown): boolean {
    return isString(value)
  }
}

export class FontSize extends String {}

export class Font extends String {} // TODO (bev) don't think this exists python side

//
// Enum properties
//

export abstract class EnumProperty<Type extends string, N> extends Primitive<Type, N> {
  readonly enum_values: Type[]

  valid(value: unknown): boolean {
    return isString(value) && includes(this.enum_values, value)
  }
}

export function Enum<Type extends string>(values: Type[]): PropertyConstructor<Type, Type> {
  return class extends EnumProperty<Type, Type> {
    get enum_values(): Type[] {
      return values
    }
  }
}

export class Direction extends EnumProperty<enums.Direction, 0 | 1> {
  get enum_values(): enums.Direction[] {
    return enums.Direction
  }

  protected normalize(value: enums.Direction): 0 | 1 {
    switch (value) {
      case "clock":     return 0
      case "anticlock": return 1
    }
  }
}

export const Anchor = Enum(enums.Anchor)
export const AngleUnits = Enum(enums.AngleUnits)
export const BoxOrigin = Enum(enums.BoxOrigin)
export const ButtonType = Enum(enums.ButtonType)
export const CalendarPosition = Enum(enums.CalendarPosition)
export const Dimension = Enum(enums.Dimension)
export const Dimensions = Enum(enums.Dimensions)
export const Distribution = Enum(enums.Distribution)
export const FontStyle = Enum(enums.FontStyle)
export const HatchPatternType = Enum(enums.HatchPatternType)
export const HTTPMethod = Enum(enums.HTTPMethod)
export const HexTileOrientation = Enum(enums.HexTileOrientation)
export const HoverMode = Enum(enums.HoverMode)
export const LatLon = Enum(enums.LatLon)
export const LegendClickPolicy = Enum(enums.LegendClickPolicy)
export const LegendLocation = Enum(enums.LegendLocation)
export const LineCap = Enum(enums.LineCap)
export const LineJoin = Enum(enums.LineJoin)
export const LinePolicy = Enum(enums.LinePolicy)
export const Location = Enum(enums.Location)
export const Logo = Enum(enums.Logo)
export const MarkerType = Enum(enums.MarkerType)
export const Orientation = Enum(enums.Orientation)
export const OutputBackend = Enum(enums.OutputBackend)
export const PaddingUnits = Enum(enums.PaddingUnits)
export const Place = Enum(enums.Place)
export const PointPolicy = Enum(enums.PointPolicy)
export const RadiusDimension = Enum(enums.RadiusDimension)
export const RenderLevel = Enum(enums.RenderLevel)
export const RenderMode = Enum(enums.RenderMode)
export const ResetPolicy = Enum(enums.ResetPolicy)
export const RoundingFunction = Enum(enums.RoundingFunction)
export const Side = Enum(enums.Side)
export const SizingMode = Enum(enums.SizingMode)
export const Sort = Enum(enums.Sort)
export const SpatialUnits = Enum(enums.SpatialUnits)
export const StartEnd = Enum(enums.StartEnd)
export const StepMode = Enum(enums.StepMode)
export const TapBehavior = Enum(enums.TapBehavior)
export const TextAlign = Enum(enums.TextAlign)
export const TextBaseline = Enum(enums.TextBaseline)
export const TextureRepetition = Enum(enums.TextureRepetition)
export const TickLabelOrientation = Enum(enums.TickLabelOrientation)
export const TooltipAttachment = Enum(enums.TooltipAttachment)
export const UpdateMode = Enum(enums.UpdateMode)
export const VerticalAlign = Enum(enums.VerticalAlign)

//
// DataSpec properties
//

export type PrimitiveType = number | bigint | boolean | string | null
export type SpecType = PrimitiveType | Arrayable<PrimitiveType> | Factor[]

export abstract class SpecProperty<Type extends SpecType, Value extends Scalar<Type> | Vector<Type>> extends Property<Type, Value> {}

export abstract class ScalarSpec<Type extends SpecType, Value extends Scalar<Type> = Scalar<Type>> extends SpecProperty<Type, Value> {

  protected _update(value: Type | Value): void {
    if (isPlainObject(value))
      this._value = value
    else
      this._value = {value} as Value

    if (this._value.value != null)
      this.validate(this._value.value)
  }

  scalar(): Type {
    let ret = this.normalize(super._value.value)
    if (this._value.transform != null)
      ret = this._value.transform.compute(ret)
    return ret
  }
}

export abstract class VectorSpec<Type extends SpecType, Value extends Vector<Type> = Vector<Type>> extends SpecProperty<Type, Value> {

  protected _update(value: Type | Value): void {
    if (isPlainObject(value))
      this._value = value
    else
      this._value = {value} as Value

    if (is_Value(this._value))
      this.validate(this._value.value)
  }

  valid(_value: unknown): boolean {
    return true
  }

  scalar(): Type {
    if (is_Value<Type>(this._value) && this._value.value !== undefined) {
      let ret = this.normalize(this._value.value)
      if (this._value.transform != null)
        ret = this._value.transform.compute(ret)
      return ret
    } else
      throw new Error("attempted to retrieve property value for property without value specification")
  }

  array(source: ColumnarDataSource): Type[] {
    let ret: any

    if (is_Field(this._value)) {
      const column = source.get_column(this._value.field)
      if (column != null)
        ret = this.v_normalize(column)
      else
        throw new Error(`attempted to retrieve property array for nonexistent field '${this._value.field}'`)
    } else if (is_Expr<Type>(this._value)) {
      ret = this.v_normalize(this._value.expr.v_compute(source))
    } else if (is_Value<Type>(this._value)) {
      const length = source.get_length() ?? 1
      const value = this.normalize(this._value.value)
      ret = repeat(value, length)
    }

    if (this._value.transform != null)
      ret = this._value.transform.v_compute(ret)

    return ret
  }

  protected v_normalize(array: Arrayable<Type>): Arrayable<any> {
    return array
  }
}

export abstract class DataSpec<Type extends SpecType> extends VectorSpec<Type, Vector<Type>> {}

export abstract class UnitsSpec<Type extends SpecType, Units> extends VectorSpec<Type, Dimensional<Vector<Type>, Units>> {
  readonly default_units: Units
  readonly valid_units: Units[]

  protected _update(value: Type | Dimensional<Vector<Type>, Units>): void {
    super._update(value)

    if (this._value.units == null)
      this._value.units = this.default_units

    const units = this._value.units
    if (!includes(this.valid_units, units))
      throw new Error(`units must be one of ${this.valid_units.join(", ")}; got: ${units}`)
  }

  get units(): Units {
    return this._value.units!
  }

  set units(units: Units) {
    this._value.units = units
  }
}

export class AngleSpec extends UnitsSpec<number, enums.AngleUnits> {
  get default_units(): enums.AngleUnits { return "rad" as "rad" }
  get valid_units(): enums.AngleUnits[] { return enums.AngleUnits }

  protected v_normalize(values: Arrayable<number>): Arrayable<number> {
    const c = this.units == "deg" ? Math.PI/180.0 : 1
    values = map(values, (x) => -c*x)
    return super.v_normalize(values)
  }
}

export class BooleanSpec extends DataSpec<boolean> {}

export class ColorSpec extends DataSpec<ColorType | null> {}

export class CoordinateSpec extends DataSpec<number | Factor> {}

export class CoordinateSeqSpec extends DataSpec<number[] | Factor[]> {}

export class DistanceSpec extends UnitsSpec<number, enums.SpatialUnits> {
  get default_units(): enums.SpatialUnits { return "data" as "data" }
  get valid_units(): enums.SpatialUnits[] { return enums.SpatialUnits }
}

export class FontSizeSpec extends DataSpec<string> {}

export class MarkerSpec extends DataSpec<string> {}

export class NumberSpec extends DataSpec<number> {}

export class StringSpec extends DataSpec<string> {}

export class NullStringSpec extends DataSpec<string | null> {}
