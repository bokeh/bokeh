import {Model} from "../../model"
import type * as p from "core/properties"
import {assert} from "core/util/assert"
import {bisect_right, bisect_right_by, sort_by} from "core/util/arrayable"

const {min} = Math

/*
const imperial_ticks = [1, 3, 6, 12, 60]
const imperial_length = ([
  ["in",   1/12, "inch"   ],
  ["ft",      1, "foot"   ],
  ["yd",      3, "yard"   ],
  ["ch",     66, "chain"  ],
  ["fur",   660, "furlong"],
  ["mi",   5280, "mile"   ],
  ["lea", 15840, "league" ],
] as const).map((item) => item)
*/

export type BasisItem = {
  factor: number
  short_name: string
  long_name: string
  tex_repr: string
}

export type Basis = BasisItem[]

export type PreferredValue = {
  new_value: number
  new_unit: string
  scale_factor: number
  exact: boolean
}

export namespace Dimensional {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    ticks: p.Property<number[]>
    include: p.Property<string[] | null>
    exclude: p.Property<string[]>
  }
}

export interface Dimensional extends Dimensional.Attrs {}

export abstract class Dimensional extends Model {
  declare properties: Dimensional.Props

  constructor(attrs?: Partial<Dimensional.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Dimensional.Props>(({Nullable, Array, String, Number}) => ({
      ticks: [ Array(Number) ],
      include: [ Nullable(Array(String)), null ],
      exclude: [ Array(String), [] ],
    }))
  }

  abstract get basis(): Basis

  compute(value: number, unit: string): PreferredValue {
    const {ticks, basis} = this

    const found_unit = basis.find(({short_name: short}) => short == unit)
    assert(found_unit != null)

    const value_in_unit = value*found_unit.factor

    const [new_unit, new_value] = (() => {
      const index = bisect_right_by(basis, value_in_unit, ({factor}) => factor)
      if (index > 0) {
        const {short_name: new_unit, factor} = basis[index - 1]
        const new_value = value_in_unit/factor
        return [new_unit, new_value]
      } else {
        return [unit, value_in_unit]
      }
    })()

    const exact = ticks.length == 0

    const preferred_value = (() => {
      if (exact) {
        return new_value
      } else {
        const index = bisect_right(ticks, new_value)
        return ticks[min(index, ticks.length-1)]
      }
    })()

    const preferred_value_raw = preferred_value*(value_in_unit/new_value)
    const scale_factor = (preferred_value_raw/value)/found_unit.factor

    return {
      new_value: preferred_value,
      new_unit,
      scale_factor,
      exact,
    }
  }
}

export namespace Metric {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Dimensional.Props
}

export interface Metric extends Metric.Attrs {}

export abstract class Metric extends Dimensional {
  declare properties: Metric.Props

  constructor(attrs?: Partial<Metric.Attrs>) {
    super(attrs)
  }

  static {
    this.override<Metric.Props>({
      ticks: [1, 2, 5, 10, 15, 20, 25, 50, 75, 100, 125, 150, 200, 250, 500, 750],
    })
  }

  build_basis(): Basis {
    const {_basis_template, _short_name, _long_name, _tex_repr} = this
    const {include, exclude} = this

    const basis = _basis_template.map(([short_prefix, factor, long_prefix, tex_prefix]) => {
      return {
        short_name: `${short_prefix}${_short_name}`,
        factor,
        long_name: `${long_prefix}${_long_name}`,
        tex_repr:  `${tex_prefix ?? short_prefix}${_tex_repr}`,
      }
    }).filter(({short_name}) => {
      return (include == null || include.includes(short_name)) && !exclude.includes(short_name)
    })

    return sort_by(basis, ({factor}) => factor)
  }

  protected _basis: Basis | null = null
  get basis(): Basis {
    if (this._basis == null) {
      this._basis = this.build_basis()
    }
    return this._basis
  }

  protected abstract _short_name: string
  protected abstract _long_name: string
  protected abstract _tex_repr: string

  protected _basis_template: [short_name: string, factor: number, long_name: string, tex: string | null][] = [
    ["Q", 1e30,  "quetta", null],
    ["R", 1e27,  "ronna", null],
    ["Y", 1e24,  "yotta", null],
    ["Z", 1e21,  "zetta", null],
    ["E", 1e18,  "exa", null],
    ["P", 1e15,  "peta", null],
    ["T", 1e12,  "tera", null],
    ["G", 1e9,   "giga", null],
    ["M", 1e6,   "mega", null],
    ["k", 1e3,   "kilo", null],
    ["h", 1e2,   "hecto", null],
    ["",  1e0,   "", null],
    ["d", 1e-1,  "deci", null],
    ["c", 1e-2,  "centi", null],
    ["m", 1e-3,  "milli", null],
    ["µ", 1e-6,  "micro", "\\mathrm{\\mu}"],
    ["n", 1e-9,  "nano", null],
    ["p", 1e-12, "pico", null],
    ["f", 1e-15, "femto", null],
    ["a", 1e-18, "atto", null],
    ["z", 1e-21, "zepto", null],
    ["y", 1e-24, "yocto", null],
    ["r", 1e-27, "ronto", null],
    ["q", 1e-30, "quecto", null],
  ]
}

export namespace MetricLength {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Metric.Props
}

export interface MetricLength extends MetricLength.Attrs {}

export class MetricLength extends Metric {
  declare properties: MetricLength.Props

  constructor(attrs?: Partial<MetricLength.Attrs>) {
    super(attrs)
  }

  static {
    this.override<MetricLength.Props>({
      exclude: ["dm", "hm"],
    })
  }

  protected _short_name = "m"
  protected _long_name = "meter"
  protected _tex_repr = "m"
}
