import {Signal0, Signal, Signalable} from "./signaling"
import {HasProps} from "./has_props"  // XXX: only for type purpose
import * as enums from "./enums"
import {Arrayable, Color as ColorType} from "./types"
import {is_svg_color} from "./util/svg_colors"
import {valid_rgb} from "./util/color"
import {includes, repeat} from "./util/array"
import {map} from "./util/arrayable"
import {isBoolean, isNumber, isString, isArray, isPlainObject} from "./util/types"
import {ColumnarDataSource} from "../models/sources/columnar_data_source"
import {Scalar, Vectorized} from "./vectorization"

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

export abstract class Property<T> extends Signalable() {

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
    this.obj = obj
    this.attr = attr
    this.default_value = default_value
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

  validate(_value: any): void {}

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

export class Any extends Property<any> {
  validator = () => true
}

export class Array extends Property<any[]> {
  validator = (x: any) => isArray(x) || x instanceof Float64Array
}

export class Boolean extends Property<boolean> {
  validator = isBoolean
}

export class Color extends Property<ColorType> {
  validator = (x: any) => (isString(x) && (is_svg_color(x.toLowerCase()) || x.substring(0, 1) == "#" || valid_rgb(x)))
}

export class Instance extends Property<HasProps> {
  validator = (x: any) => x.properties != null
}

export class Number extends Property<number> {
  validator = isNumber
}

export class Int extends Number {}

export class Angle extends Number {}

export class Percent extends Property<number> {
  validator = (x: any) => isNumber(x) && 0 <= x && x <= 1.0
}

export class String extends Property<string> {
  validator = isString
}

export class FontSize extends String {}

export class Font extends String {} // TODO (bev) don't think this exists python side

//
// Enum properties
//

export abstract class Enum<T> extends Property<T> {
  enum_values: T[]
  validator = (value: any) => includes(this.enum_values, value)
}

export class Anchor extends Enum<enums.Anchor> {}

export class AngleUnits extends Enum<enums.AngleUnits> {}

export class Direction extends Enum<enums.Direction> {
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

export class Dimension extends Enum<enums.Dimension> {}

export class Dimensions extends Enum<enums.Dimensions> {}

export class FontStyle extends Enum<enums.FontStyle> {}

export class LatLon extends Enum<enums.LatLon> {}

export class LineCap extends Enum<enums.LineCap> {}

export class LineJoin extends Enum<enums.LineJoin> {}

export class LegendLocation extends Enum<enums.LegendLocation> {}

export class Location extends Enum<enums.Location> {}

export class OutputBackend extends Enum<enums.OutputBackend> {}

export class Orientation extends Enum<enums.Orientation> {}

export class VerticalAlign extends Enum<enums.VerticalAlign> {}

export class TextAlign extends Enum<enums.TextAlign> {}

export class TextBaseline extends Enum<enums.TextBaseline> {}

export class RenderLevel extends Enum<enums.RenderLevel> {}

export class RenderMode extends Enum<enums.RenderMode> {}

export class SizingMode extends Enum<enums.SizingMode> {}

export class SpatialUnits extends Enum<enums.SpatialUnits> {}

export class Distribution extends Enum<enums.Distribution> {}

export class StepMode extends Enum<enums.StepMode> {}

export class PaddingUnits extends Enum<enums.PaddingUnits> {}

export class StartEnd extends Enum<enums.StartEnd> {}

//
// DataSpec properties
//

export abstract class ScalarSpec<T> extends Property<Scalar<T>> {}

export abstract class DataSpec<T> extends Property<Vectorized<T>> {
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

export abstract class UnitsSpec<T, Units> extends DataSpec<T> {
  default_units: Units
  valid_units: Units[]

  init(): void {
    if (this.spec.units == null)
      this.spec.units = this.default_units

    /*
    const units = this.spec.units
    if (!includes(this.valid_units, units))
      throw new Error(`${name} units must be one of ${this.valid_units}, given invalid value: ${units}`)
    */
  }

  get units(): Units {
    return this.spec.units as Units
  }

  set units(units: Units) {
    this.spec.units = units
  }
}

export class AngleSpec extends UnitsSpec<number, enums.AngleUnits> {
  default_units = "rad" as "rad"
  valid_units = enums.AngleUnits

  transform(values: Arrayable): Arrayable {
    if (this.spec.units == "deg")
      values = map(values, (x: number) => x * Math.PI/180.0)
    values = map(values, (x: number) => -x)
    return super.transform(values)
  }
}

export class ColorSpec extends DataSpec<ColorType | null> {}

export class DistanceSpec extends UnitsSpec<number, enums.SpatialUnits> {
  default_units = "data" as "data"
  valid_units = enums.SpatialUnits
}

export class FontSizeSpec extends DataSpec<string> {}

export class MarkerSpec extends DataSpec<string> {}

export class NumberSpec extends DataSpec<number> {}

export class StringSpec extends DataSpec<string> {}
