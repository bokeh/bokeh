import {Range} from "./range"
import {PaddingUnits} from "core/enums"
import * as p from "core/properties"
import {Arrayable} from "core/types"
import {map} from "core/util/arrayable"
import {all, sum} from "core/util/array"
import {isArray, isNumber, isString} from "core/util/types"

export type L1Factor = string
export type L2Factor = [string, string]
export type L3Factor = [string, string, string]

export type Factor = L1Factor | L2Factor | L3Factor

export type L1OffsetFactor = [string, number]
export type L2OffsetFactor = [string, string, number]
export type L3OffsetFactor = [string, string, string, number]

export type OffsetFactor = L1OffsetFactor | L2OffsetFactor | L3OffsetFactor

export type L1Mapping = {[key: string]: {value: number}}
export type L2Mapping = {[key: string]: {value: number, mapping: L1Mapping}}
export type L3Mapping = {[key: string]: {value: number, mapping: L2Mapping}}

export function map_one_level(factors: L1Factor[], padding: number, offset: number = 0): [L1Mapping, number] {
  const mapping: {[key: string]: {value: number}} = {}

  for (let i = 0; i < factors.length; i++) {
    const factor = factors[i]
    if (factor in mapping)
      throw new Error(`duplicate factor or subfactor: ${factor}`)
    else
      mapping[factor] = {value: 0.5 + i*(1 + padding) + offset}
  }

  return [mapping, (factors.length - 1)*padding]
}

export function map_two_levels(factors: L2Factor[],
                               outer_pad: number, factor_pad: number,
                               offset: number = 0): [L2Mapping, string[], number] {
  const mapping: L2Mapping = {}

  const tops: {[key: string]: string[]} = {}
  const tops_order: string[] = []
  for (const [f0, f1] of factors) {
    if (!(f0 in tops)) {
      tops[f0] = []
      tops_order.push(f0)
    }
    tops[f0].push(f1)
  }

  let suboffset = offset
  let total_subpad = 0
  for (const f0 of tops_order) {
    const n = tops[f0].length
    const [submap, subpad] = map_one_level(tops[f0], factor_pad, suboffset)
    total_subpad += subpad
    const subtot = sum(tops[f0].map((f1) => submap[f1].value))
    mapping[f0] = {value: subtot/n, mapping: submap}
    suboffset += n + outer_pad + subpad
  }

  return [mapping, tops_order, (tops_order.length-1)*outer_pad + total_subpad]
}

export function map_three_levels(factors: L3Factor[],
                                 outer_pad: number, inner_pad: number, factor_pad: number,
                                 offset: number = 0): [L3Mapping, string[], [string, string][], number] {
  const mapping: L3Mapping = {}

  const tops: {[key: string]: [string, string][]} = {}
  const tops_order: string[] = []
  for (const [f0, f1, f2] of factors) {
    if (!(f0 in tops)) {
      tops[f0] = []
      tops_order.push(f0)
    }
    tops[f0].push([f1, f2])
  }

  const mids_order: [string, string][] = []

  let suboffset = offset
  let total_subpad = 0
  for (const f0 of tops_order) {
    const n = tops[f0].length
    const [submap, submids_order, subpad] = map_two_levels(tops[f0], inner_pad, factor_pad, suboffset)
    for (const f1 of submids_order)
      mids_order.push([f0, f1])
    total_subpad += subpad
    const subtot = sum(tops[f0].map(([f1,]) => submap[f1].value))
    mapping[f0] = {value: subtot/n, mapping: submap}
    suboffset += n + outer_pad + subpad
  }

  return [mapping, tops_order, mids_order, (tops_order.length-1)*outer_pad + total_subpad]
}

export namespace FactorRange {
  export interface Attrs extends Range.Attrs {
    factors: Factor[]
    factor_padding: number
    subgroup_padding: number
    group_padding: number
    range_padding: number
    range_padding_units: PaddingUnits
    start: number
    end: number

    levels: number
    mids: [string, string][] | undefined
    tops: string[] | undefined
    tops_groups: string[]
  }

  export interface Props extends Range.Props {
    factors: p.Property<Factor[]>
    factor_padding: p.Property<number>
    subgroup_padding: p.Property<number>
    group_padding: p.Property<number>
    range_padding: p.Property<number>
    range_padding_units: p.Property<PaddingUnits>
    start: p.Property<number>
    end: p.Property<number>
  }
}

export interface FactorRange extends FactorRange.Attrs {}

export class FactorRange extends Range {

  properties: FactorRange.Props

  constructor(attrs?: Partial<FactorRange.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "FactorRange"

    this.define({
      factors:             [ p.Array,        []        ],
      factor_padding:      [ p.Number,       0         ],
      subgroup_padding:    [ p.Number,       0.8       ],
      group_padding:       [ p.Number,       1.4       ],
      range_padding:       [ p.Number,       0         ],
      range_padding_units: [ p.PaddingUnits, "percent" ],
      start:               [ p.Number                  ],
      end:                 [ p.Number                  ],
    })

    this.internal({
      levels:      [ p.Number ], // how many levels of
      mids:        [ p.Array  ], // mid level factors (if 3 total levels)
      tops:        [ p.Array  ], // top level factors (whether 2 or 3 total levels)
      tops_groups: [ p.Array  ], // ordered list of full factors for each top level factor in tops
    })
  }

  protected _mapping: L1Mapping | L2Mapping | L3Mapping

  get min(): number {
    return this.start
  }

  get max(): number {
    return this.end
  }

  initialize(): void {
    super.initialize()
    this._init(true)
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.properties.factors.change, () => this.reset())
    this.connect(this.properties.factor_padding.change, () => this.reset())
    this.connect(this.properties.group_padding.change, () => this.reset())
    this.connect(this.properties.subgroup_padding.change, () => this.reset())
    this.connect(this.properties.range_padding.change, () => this.reset())
    this.connect(this.properties.range_padding_units.change, () => this.reset())
  }

  reset(): void {
    this._init(false)
    this.change.emit()
  }

  protected _lookup(x: any): number {
    if (x.length == 1) {
      const m = this._mapping as L1Mapping
      if (!m.hasOwnProperty(x[0])) {
        return NaN
      }
      return m[x[0]].value
    } else if (x.length == 2) {
      const m = this._mapping as L2Mapping
      if (!m.hasOwnProperty(x[0]) || !m[x[0]].mapping.hasOwnProperty(x[1])) {
        return NaN
      }
      return m[x[0]].mapping[x[1]].value
    } else if (x.length == 3) {
      const m = this._mapping as L3Mapping
      if (!m.hasOwnProperty(x[0]) || !m[x[0]].mapping.hasOwnProperty(x[1]) || !m[x[0]].mapping[x[1]].mapping.hasOwnProperty(x[2]))  {
        return NaN
      }
      return m[x[0]].mapping[x[1]].mapping[x[2]].value
    } else
      throw new Error("unreachable code")
  }

  // convert a string factor into a synthetic coordinate
  synthetic(x: number | Factor | OffsetFactor): number {
    if (isNumber(x))
      return x

    if (isString(x))
      return this._lookup([x])

    let offset = 0
    const off = x[x.length-1]
    if (isNumber(off)) {
      offset = off
      x = x.slice(0, -1) as Factor
    }

    return this._lookup(x) + offset
  }

  // convert an array of string factors into synthetic coordinates
  v_synthetic(xs: Arrayable<number | Factor | OffsetFactor>): Arrayable<number> {
    return map(xs, (x) => this.synthetic(x))
  }

  protected _init(silent: boolean): void {
    let levels: number
    let inside_padding: number
    if (all(this.factors as any, isString)) {
      levels = 1;
      [this._mapping, inside_padding] = map_one_level(this.factors as string[], this.factor_padding)
    } else if (all(this.factors as any, (x) => isArray(x) && x.length == 2 && isString(x[0]) && isString(x[1]))) {
      levels = 2;
      [this._mapping, this.tops, inside_padding] = map_two_levels(this.factors as [string, string][], this.group_padding, this.factor_padding)
    } else if (all(this.factors as any, (x) => isArray(x) && x.length == 3  && isString(x[0]) && isString(x[1]) && isString(x[2]))) {
      levels = 3;
      [this._mapping, this.tops, this.mids, inside_padding] = map_three_levels(this.factors as [string, string, string][], this.group_padding, this.subgroup_padding, this.factor_padding)
    } else
      throw new Error("???")

    let start = 0
    let end = this.factors.length + inside_padding

    if (this.range_padding_units == "percent") {
      const half_span = (end - start) * this.range_padding / 2
      start -= half_span
      end += half_span
    } else {
      start -= this.range_padding
      end += this.range_padding
    }

    this.setv({start: start, end: end, levels: levels}, {silent: silent})

    if (this.bounds == "auto")
      this.setv({bounds: [start, end]}, {silent: true})
  }
}

FactorRange.initClass()
