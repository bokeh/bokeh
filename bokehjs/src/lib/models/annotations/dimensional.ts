import {Model} from "../../model"
import type {Dict} from "core/types"
import type * as p from "core/properties"
import {assert} from "core/util/assert"
import {entries} from "core/util/object"
import {bisect_right, bisect_right_by, sort_by} from "core/util/arrayable"

const {min} = Math

export type BasisItem = {
  name: string
  factor: number
  tex_name: string
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

  abstract get_basis(): Dict<[number, string, string?]>

  static {
    this.define<Dimensional.Props>(({Nullable, List, Str, Float}) => ({
      ticks: [ List(Float) ],
      include: [ Nullable(List(Str)), null ],
      exclude: [ List(Str), [] ],
    }))
  }

  compute(value: number, unit: string, exact?: boolean): PreferredValue {
    const basis = (() => {
      const {include, exclude} = this
      const basis = entries(this.get_basis())
        .map(([name, [factor, tex_name, long_name]]) => ({name, factor, tex_name, long_name}))
        .filter(({name}) => (include == null || include.includes(name)) && !exclude.includes(name))
      return sort_by(basis, ({factor}) => factor)
    })()

    const {ticks} = this

    const found_unit = basis.find(({name}) => name == unit)
    assert(found_unit != null)

    const value_in_unit = value*found_unit.factor

    const [new_unit, new_value] = (() => {
      const index = bisect_right_by(basis, value_in_unit, ({factor}) => factor)
      if (index > 0) {
        const {name: new_unit, factor} = basis[index - 1]
        const new_value = value_in_unit/factor
        return [new_unit, new_value]
      } else {
        return [unit, value_in_unit]
      }
    })()

    exact = exact ?? ticks.length == 0

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

export namespace CustomDimensional {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Dimensional.Props & {
    basis: p.Property<Dict<[number, string, string?]>>
  }
}

export interface CustomDimensional extends CustomDimensional.Attrs {}

export abstract class CustomDimensional extends Dimensional {
  declare properties: CustomDimensional.Props

  constructor(attrs?: Partial<CustomDimensional.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CustomDimensional.Props>(({Dict, Tuple, Float, Str, Or}) => ({
      basis: [ Dict(Or(Tuple(Float, Str), Tuple(Float, Str, Str))) ],
    }))
  }

  get_basis(): Dict<[number, string, string?]> {
    return this.basis
  }
}

export namespace Metric {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Dimensional.Props & {
    base_unit: p.Property<string>
    full_unit: p.Property<string | null>
  }
}

export interface Metric extends Metric.Attrs {}

export class Metric extends Dimensional {
  declare properties: Metric.Props

  constructor(attrs?: Partial<Metric.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Metric.Props>(({Str, Nullable}) => ({
      base_unit: [ Str ],
      full_unit: [ Nullable(Str), null ],
    }))

    this.override<Metric.Props>({
      ticks: [1, 2, 5, 10, 15, 20, 25, 50, 75, 100, 125, 150, 200, 250, 500, 750],
    })
  }

  static _metric_basis = [
    ["Q", 1e30,  "Q",    "quetta"],
    ["R", 1e27,  "R",    "ronna" ],
    ["Y", 1e24,  "Y",    "yotta" ],
    ["Z", 1e21,  "Z",    "zetta" ],
    ["E", 1e18,  "E",    "exa"   ],
    ["P", 1e15,  "P",    "peta"  ],
    ["T", 1e12,  "T",    "tera"  ],
    ["G", 1e9,   "G",    "giga"  ],
    ["M", 1e6,   "M",    "mega"  ],
    ["k", 1e3,   "k",    "kilo"  ],
    ["h", 1e2,   "h",    "hecto" ],
    ["",  1e0,   "",     ""      ],
    ["d", 1e-1,  "d",    "deci"  ],
    ["c", 1e-2,  "c",    "centi" ],
    ["m", 1e-3,  "m",    "milli" ],
    ["µ", 1e-6,  "\\mu", "micro" ],
    ["n", 1e-9,  "n",    "nano"  ],
    ["p", 1e-12, "p",    "pico"  ],
    ["f", 1e-15, "f",    "femto" ],
    ["a", 1e-18, "a",    "atto"  ],
    ["z", 1e-21, "z",    "zepto" ],
    ["y", 1e-24, "y",    "yocto" ],
    ["r", 1e-27, "r",    "ronto" ],
    ["q", 1e-30, "q",    "quecto"],
  ] as const

  get_basis(): Dict<[number, string, string?]> {
    const {base_unit, full_unit} = this
    const basis: {[key: string]: [number, string, string?]} = {}

    for (const [prefix, factor, tex_prefix, long_prefix] of Metric._metric_basis) {
      const name = `${prefix}${base_unit}`
      const tex_name = `${tex_prefix}${base_unit}`
      const long_name = full_unit != null ? `${long_prefix}${full_unit}` : undefined
      basis[name] = [factor, tex_name, long_name]
    }

    return basis
  }
}

export namespace ReciprocalMetric {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Metric.Props
}

export interface ReciprocalMetric extends ReciprocalMetric.Attrs {}

export class ReciprocalMetric extends Metric {
  declare properties: ReciprocalMetric.Props

  constructor(attrs?: Partial<ReciprocalMetric.Attrs>) {
    super(attrs)
  }

  override get_basis(): Dict<[number, string, string?]> {
    const basis = super.get_basis()
    const reciprocal_basis: {[key: string]: [number, string]} = {}

    for (const [name, [factor, tex_name]] of entries(basis)) {
      reciprocal_basis[`${name}⁻1`] = [factor**-1, `${tex_name}^{-1}`]
    }

    return reciprocal_basis
  }
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
      base_unit: "m",
      exclude: ["dm", "hm"],
    })
  }
}

export namespace ReciprocalMetricLength {
  export type Attrs = p.AttrsOf<Props>
  export type Props = ReciprocalMetric.Props
}

export interface ReciprocalMetricLength extends MetricLength.Attrs {}

export class ReciprocalMetricLength extends ReciprocalMetric {
  declare properties: ReciprocalMetricLength.Props

  constructor(attrs?: Partial<ReciprocalMetricLength.Attrs>) {
    super(attrs)
  }

  static {
    this.override<ReciprocalMetricLength.Props>({
      base_unit: "m",
      exclude: ["dm", "hm"],
    })
  }
}

export namespace ImperialLength {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CustomDimensional.Props
}

export interface ImperialLength extends ImperialLength.Attrs {}

export abstract class ImperialLength extends CustomDimensional {
  declare properties: ImperialLength.Props

  constructor(attrs?: Partial<ImperialLength.Attrs>) {
    super(attrs)
  }

  static {
    this.override<ImperialLength.Props>({
      basis: {
        in:  [ 1/12, "in",  "inch"   ],
        ft:  [    1, "ft",  "foot"   ],
        yd:  [    3, "yd",  "yard"   ],
        ch:  [   66, "ch",  "chain"  ],
        fur: [  660, "fur", "furlong"],
        mi:  [ 5280, "mi",  "mile"   ],
        lea: [15840, "lea", "league" ],
      },
      ticks: [1, 3, 6, 12, 60],
    })
  }
}

export namespace Angular {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CustomDimensional.Props
}

export interface Angular extends Angular.Attrs {}

export abstract class Angular extends CustomDimensional {
  declare properties: Angular.Props

  constructor(attrs?: Partial<Angular.Attrs>) {
    super(attrs)
  }

  static {
    this.override<Angular.Props>({
      basis: {
        "°":  [1,      "^\\circ",           "degree"],
        "'":  [1/60,   "^\\prime",          "minute"],
        "''": [1/3600, "^{\\prime\\prime}", "second"],
      },
      ticks: [1, 3, 6, 12, 60, 120, 240, 360],
    })
  }
}
