import {Signal0, Signal, Signalable} from "./signaling"
import {HasProps} from "./has_props"  // XXX: only for type purpose
import * as enums from "./enums"
import {Arrayable, Color as ColorType} from "./types"
import {includes, repeat} from "./util/array"
import {map} from "./util/arrayable"
import {is_color} from "./util/color"
import {isBoolean, isNumber, isString, isArray, isPlainObject} from "./util/types"
import {Factor/*, OffsetFactor*/} from "../models/ranges/factor_range"
import {ColumnarDataSource} from "../models/sources/columnar_data_source"
import {Scalar, Vector, Dimensional} from "./vectorization"

Signal // XXX: silence TS, because `Signal` appears in declarations due to Signalable

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

//
// Property base class
//

export type AttrsOf<P> = {
  [K in keyof P]: P[K] extends Property<infer T> ? T : never
}

export type DefineOf<P> = {
  [K in keyof P]: P[K] extends Property<infer T> ? [PropertyConstructor<T>, (T | (() => T))?] : never
}

export interface PropertyConstructor<T> {
  new (obj: HasProps, attr: string, default_value?: (obj: HasProps) => T): Property<T>
  readonly prototype: Property<T>
}

export abstract class Property<T> extends Signalable() {
  __value__: T

  spec: {
    value?: any
    field?: string
    expr?: any
    transform?: any // Transform
    units?: any
  }

  optional: boolean = false

  readonly change: Signal0<HasProps>

  constructor(readonly obj: HasProps,
              readonly attr: string,
              readonly default_value?: (obj: HasProps) => T) {
    super()
    this.change = new Signal0(this.obj, "change")
    this._init()
    this.connect(this.change, () => this._init())
  }

  update(): void {
    this._init()
  }

  // ----- customizable policies

  init(): void {}

  transform(values: any): any {
    return values
  }

  validate(value: any): void {
    if (!this.valid(value))
      throw new Error(`${this.obj.type}.${this.attr} given invalid value: ${valueToString(value)}`)
  }

  valid(_value: unknown): boolean {
    return true
  }

  // ----- property accessors

  value(do_spec_transform: boolean = true): any {
    if (this.spec.value === undefined)
      throw new Error("attempted to retrieve property value for property without value specification")
    let ret = this.transform([this.spec.value])[0]
    if (this.spec.transform != null && do_spec_transform)
      ret = this.spec.transform.compute(ret)
    return ret
  }

  // ----- private methods

  /*protected*/ _init(): void {
    const obj = this.obj
    const attr = this.attr
    let attr_value: any = obj.getv(attr)

    if (attr_value === undefined) {
      const default_value = this.default_value
      if (default_value !== undefined)
        attr_value = default_value(obj)
      else
        attr_value = null
      obj.setv({[attr]: attr_value}, {silent: true, defaults: true})
    }

    if (isArray(attr_value))
      this.spec = {value: attr_value}
    else if (isSpec(attr_value))
      this.spec = attr_value
    else
      this.spec = {value: attr_value}

    //if (this.dataspec && this.spec.field != null && !isString(this.spec.field))
    //  throw new Error(`field value for property '${attr}' is not a string`)

    if (this.spec.value != null)
      this.validate(this.spec.value)

    this.init()
  }

  toString(): string {
    /*${this.name}*/
    return `Prop(${this.obj}.${this.attr}, spec: ${valueToString(this.spec)})`
  }
}

//
// Primitive Properties
//

export class Any extends Property<any> {}

export class Array extends Property<any[]> {
  valid(value: unknown): boolean {
    return isArray(value) || value instanceof Float64Array
  }
}

export class Boolean extends Property<boolean> {
  valid(value: unknown): boolean {
    return isBoolean(value)
  }
}

export class Color extends Property<ColorType> {
  valid(value: unknown): boolean {
    return isString(value) && is_color(value)
  }
}

export class Instance extends Property<any /*HasProps*/> {
  //valid(value: unknown): boolean { return  value.properties != null }
}

export class Number extends Property<number> {
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

export class String extends Property<string> {
  valid(value: unknown): boolean {
    return isString(value)
  }
}

export class FontSize extends String {}

export class Font extends String {} // TODO (bev) don't think this exists python side

//
// Enum properties
//

export abstract class EnumProperty<T extends string> extends Property<T> {
  readonly enum_values: T[]

  valid(value: unknown): boolean {
    return isString(value) && includes(this.enum_values, value)
  }
}

export function Enum<T extends string>(values: T[]): PropertyConstructor<T> {
  return class extends EnumProperty<T> {
    get enum_values(): T[] {
      return values
    }
  }
}

export class Direction extends EnumProperty<enums.Direction> {
  get enum_values(): enums.Direction[] {
    return enums.Direction
  }

  transform(values: any): any {
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

export const Anchor = Enum(enums.Anchor)
export const AngleUnits = Enum(enums.AngleUnits)
export const BoxOrigin = Enum(enums.BoxOrigin)
export const ButtonType = Enum(enums.ButtonType)
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
export const SliderCallbackPolicy = Enum(enums.SliderCallbackPolicy)
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

export abstract class ScalarSpec<T, S extends Scalar<T> = Scalar<T>> extends Property<T | S> {
  __value__: T
  __scalar__: S
}

export abstract class VectorSpec<T, V extends Vector<T> = Vector<T>> extends Property<T | V> {
  __value__: T
  __vector__: V

  array(source: ColumnarDataSource): any[] {
    let ret: any

    if (this.spec.field != null) {
      ret = this.transform(source.get_column(this.spec.field))
      if (ret == null)
        throw new Error(`attempted to retrieve property array for nonexistent field '${this.spec.field}'`)
    } else if (this.spec.expr != null) {
      ret = this.transform(this.spec.expr.v_compute(source))
    } else {
      let length = source.get_length()
      if (length == null)
        length = 1
      const value = this.value(false) // don't apply any spec transform
      ret = repeat(value, length)
    }

    if (this.spec.transform != null)
      ret = this.spec.transform.v_compute(ret)
    return ret
  }
}

export abstract class DataSpec<T> extends VectorSpec<T> {}

export abstract class UnitsSpec<T, Units> extends VectorSpec<T, Dimensional<Vector<T>, Units>> {
  readonly default_units: Units
  readonly valid_units: Units[]

  init(): void {
    if (this.spec.units == null)
      this.spec.units = this.default_units

    const units = this.spec.units
    if (!includes(this.valid_units, units))
      throw new Error(`units must be one of ${this.valid_units.join(", ")}; got: ${units}`)
  }

  get units(): Units {
    return this.spec.units as Units
  }

  set units(units: Units) {
    this.spec.units = units
  }
}

export class AngleSpec extends UnitsSpec<number, enums.AngleUnits> {
  get default_units(): enums.AngleUnits { return "rad" as "rad" }
  get valid_units(): enums.AngleUnits[] { return enums.AngleUnits }

  transform(values: Arrayable): Arrayable {
    if (this.spec.units == "deg")
      values = map(values, (x: number) => x * Math.PI/180.0)
    values = map(values, (x: number) => -x)
    return super.transform(values)
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
