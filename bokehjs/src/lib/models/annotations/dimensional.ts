import {Model} from "../../model"
import type {DictLike} from "core/types"
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
    basis: p.Property<DictLike<[number, string]>>
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
    this.define<Dimensional.Props>(({Nullable, Array, String, Number, Dict, Tuple}) => ({
      basis: [ Dict(Tuple(Number, String)) ],
      ticks: [ Array(Number) ],
      include: [ Nullable(Array(String)), null ],
      exclude: [ Array(String), [] ],
    }))
  }

  compute(value: number, unit: string, exact?: boolean): PreferredValue {
    const basis = (() => {
      const {include, exclude} = this
      const basis = entries(this.basis)
        .map(([name, [factor, tex_name]]) => ({name, factor, tex_name}))
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

export namespace Metric {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Dimensional.Props
}

export interface Metric extends Metric.Attrs {}

export class Metric extends Dimensional {
  declare properties: Metric.Props

  constructor(attrs?: Partial<Metric.Attrs>) {
    super(attrs)
  }

  static {
    this.override<Metric.Props>({
      ticks: [1, 2, 5, 10, 15, 20, 25, 50, 75, 100, 125, 150, 200, 250, 500, 750],
    })
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
      exclude: ["dm", "hm"],
    })
  }
}

export namespace ImperialLength {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Dimensional.Props
}

export interface ImperialLength extends ImperialLength.Attrs {}

export abstract class ImperialLength extends Dimensional {
  declare properties: ImperialLength.Props

  constructor(attrs?: Partial<ImperialLength.Attrs>) {
    super(attrs)
  }

  static {
    this.override<ImperialLength.Props>({
      basis: {
        in:  [ 1/12, "in" ],
        ft:  [    1, "ft" ],
        yd:  [    3, "yd" ],
        ch:  [   66, "ch" ],
        fur: [  660, "fur"],
        mi:  [ 5280, "mi" ],
        lea: [15840, "lea"],
      },
      ticks: [1, 3, 6, 12, 60],
    })
  }
}

export namespace Angular {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Dimensional.Props
}

export interface Angular extends Angular.Attrs {}

export abstract class Angular extends Dimensional {
  declare properties: Angular.Props

  constructor(attrs?: Partial<Angular.Attrs>) {
    super(attrs)
  }

  static {
    this.override<Angular.Props>({
      basis: {
        "°":  [1,      "^\\circ"          ],
        "'":  [1/60,   "^\\prime"         ],
        "\"": [1/3600, "^{\\prime\\prime}"],
      },
      ticks: [1, 3, 6, 12, 60, 120, 240, 360],
    })
  }
}
