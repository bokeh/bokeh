import {Range} from "./range"
import {PaddingUnits} from "core/enums"
import * as p from "core/properties"
import {Or, Str, List, Tuple} from "core/kinds"
import type {Arrayable} from "core/types"
import {ScreenArray} from "core/types"
import {Signal0} from "core/signaling"
import {every, sum} from "core/util/array"
import {isArray, isNumber, isString} from "core/util/types"
import {unreachable} from "core/util/assert"

export type L1Factor = string
export type L2Factor = [string, string]
export type L3Factor = [string, string, string]

export type Factor = L1Factor | L2Factor | L3Factor
export type FactorSeq = L1Factor[] | L2Factor[] | L3Factor[]

export const Factor = Or(Str, Tuple(Str, Str), Tuple(Str, Str, Str))
export const FactorSeq = Or(List(Str), List(Tuple(Str, Str)), List(Tuple(Str, Str, Str)))

export type BoxedFactor = [string] | L2Factor | L3Factor

export type L1Factors = Arrayable<L1Factor>
export type L2Factors = Arrayable<L2Factor>
export type L3Factors = Arrayable<L3Factor>

export type Factors = L1Factors | L2Factors | L3Factors

export type L1OffsetFactor = [string, number]
export type L2OffsetFactor = [string, string, number]
export type L3OffsetFactor = [string, string, string, number]

export type OffsetFactor = L1OffsetFactor | L2OffsetFactor | L3OffsetFactor

export type FactorLike = number | Factor | BoxedFactor | OffsetFactor

export type L1Mapping = Map<string, {value: number}>
export type L2Mapping = Map<string, {value: number, mapping: L1Mapping}>
export type L3Mapping = Map<string, {value: number, mapping: L2Mapping}>

export type Mapping = L1Mapping | L2Mapping | L3Mapping

export type MappingSpec = {mapping: Mapping, tops: L1Factor[] | null, mids: L2Factor[] | null, inner_padding: number}

export type MappingEntry = {value: number, mapping?: L1Mapping | L2Mapping}

export function map_one_level(
    factors: L1Factor[],
    padding: number,
    offset: number = 0): MappingSpec {
  const mapping: L1Mapping = new Map()

  for (let i = 0; i < factors.length; i++) {
    const factor = factors[i]
    if (mapping.has(factor)) {
      throw new Error(`duplicate factor or subfactor: ${factor}`)
    }
    mapping.set(factor, {value: 0.5 + i*(1 + padding) + offset})
  }

  const inner_padding = (factors.length - 1)*padding
  return {mapping, tops: null, mids: null, inner_padding}
}

export function map_two_levels(
    factors: L2Factor[],
    outer_pad: number,
    factor_pad: number,
    offset: number = 0): MappingSpec {
  const mapping: L2Mapping = new Map()

  const tops: Map<string, L1Factor[]> = new Map()
  for (const [f0, f1] of factors) {
    const top = tops.get(f0) ?? []
    tops.set(f0, [...top, f1])
  }

  let suboffset = offset
  let total_subpad = 0
  for (const [f0, top] of tops) {
    const n = top.length
    const sub = map_one_level(top, factor_pad, suboffset)
    total_subpad += sub.inner_padding
    const subtot = sum(top.map((f1) => sub.mapping.get(f1)!.value))
    mapping.set(f0, {value: subtot/n, mapping: sub.mapping})
    suboffset += n + outer_pad + sub.inner_padding
  }

  const inner_padding = (tops.size - 1)*outer_pad + total_subpad
  return {mapping, tops: [...mapping.keys()], mids: null, inner_padding}
}

export function map_three_levels(
    factors: L3Factor[],
    outer_pad: number,
    inner_pad: number,
    factor_pad: number,
    offset: number = 0): MappingSpec {
  const mapping: L3Mapping = new Map()

  const tops: Map<L1Factor, L2Factor[]> = new Map()
  for (const [f0, f1, f2] of factors) {
    const top = tops.get(f0) ?? []
    tops.set(f0, [...top, [f1, f2]])
  }

  let suboffset = offset
  let total_subpad = 0
  for (const [f0, top] of tops) {
    const n = top.length
    const sub = map_two_levels(top, inner_pad, factor_pad, suboffset)
    total_subpad += sub.inner_padding
    const subtot = sum(top.map(([f1]) => sub.mapping.get(f1)!.value))
    mapping.set(f0, {value: subtot/n, mapping: sub.mapping as L2Mapping})
    suboffset += n + outer_pad + sub.inner_padding
  }

  const mids: L2Factor[] = []
  for (const [f0, L2] of mapping) {
    for (const f1 of L2.mapping.keys()) {
      mids.push([f0, f1])
    }
  }

  const inner_padding = (tops.size - 1)*outer_pad + total_subpad
  return {mapping, tops: [...mapping.keys()], mids, inner_padding}
}

const is_l1 = isString
const is_l2 = (x: any) => isArray(x) && x.length == 2 && isString(x[0]) && isString(x[1])
const is_l3 = (x: any) => isArray(x) && x.length == 3 && isString(x[0]) && isString(x[1]) && isString(x[2])

export function compute_levels(factors: Factor[]): 1 | 2 | 3 {
  if (every(factors, is_l1)) {
    return 1
  }
  if (every(factors, is_l2)) {
    return 2
  }
  if (every(factors, is_l3)) {
    return 3
  }
  unreachable()
}

export function map_l1(x: [string], mapping: Mapping): MappingEntry | null {
  const [f0] = x
  return mapping.get(f0) ?? null
}

export function map_l2(x: L2Factor, mapping: L2Mapping | L3Mapping): MappingEntry | null {
  const [f0, f1] = x
  return mapping.get(f0)?.mapping.get(f1) ?? null
}

export function map_l3(x: L3Factor, mapping: L3Mapping): MappingEntry | null {
  const [f0, f1, f2] = x
  return mapping.get(f0)?.mapping.get(f1)?.mapping.get(f2) ?? null
}

export namespace FactorRange {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Range.Props & {
    factors: p.Property<Factor[]>
    factor_padding: p.Property<number>
    subgroup_padding: p.Property<number>
    group_padding: p.Property<number>
    range_padding: p.Property<number>
    range_padding_units: p.Property<PaddingUnits>
    start: p.Property<number>
    end: p.Property<number>

    levels: p.Property<number>
    mids: p.Property<[string, string][] | null>
    tops: p.Property<string[] | null>
  }
}

export interface FactorRange extends FactorRange.Attrs {}

export class FactorRange extends Range {
  declare properties: FactorRange.Props

  constructor(attrs?: Partial<FactorRange.Attrs>) {
    super(attrs)
  }

  static {
    this.define<FactorRange.Props>(({Float}) => ({
      factors:             [ FactorSeq, [] ],
      factor_padding:      [ Float, 0 ],
      subgroup_padding:    [ Float, 0.8 ],
      group_padding:       [ Float, 1.4 ],
      range_padding:       [ Float, 0 ],
      range_padding_units: [ PaddingUnits, "percent" ],
      start:               [ Float, p.unset, {readonly: true} ],
      end:                 [ Float, p.unset, {readonly: true} ],
    }))

    this.internal<FactorRange.Props>(({Int, Str, List, Tuple, Nullable}) => ({
      levels: [ Int ], // how many levels of nesting
      mids:   [ Nullable(List(Tuple(Str, Str))), null ], // mid level factors (if 3 total levels)
      tops:   [ Nullable(List(Str)), null ], // top level factors (whether 2 or 3 total levels)
    }))
  }

  protected mapping: Mapping

  get min(): number {
    return this.start
  }

  get max(): number {
    return this.end
  }

  override initialize(): void {
    super.initialize()
    this._init()
  }

  override connect_signals(): void {
    super.connect_signals()

    this.connect(this.properties.factors.change, () => this.reset())
    this.connect(this.properties.factor_padding.change, () => this.reset())
    this.connect(this.properties.group_padding.change, () => this.reset())
    this.connect(this.properties.subgroup_padding.change, () => this.reset())
    this.connect(this.properties.range_padding.change, () => this.reset())
    this.connect(this.properties.range_padding_units.change, () => this.reset())
  }

  readonly invalidate_synthetic = new Signal0(this, "invalidate_synthetic")

  reset(): void {
    this._init()
    this.invalidate_synthetic.emit()
  }

  protected _lookup_entry(x: BoxedFactor): MappingEntry | null {
    switch (x.length) {
      case 1: {
        return map_l1(x, this.mapping as L1Mapping)
      }
      case 2: {
        return map_l2(x, this.mapping as L2Mapping)
      }
      case 3: {
        return map_l3(x, this.mapping as L3Mapping)
      }
    }
  }

  protected _lookup_value(x: BoxedFactor): number {
    return this._lookup_entry(x)?.value ?? NaN
  }

  // convert a categorical factor into a synthetic coordinate
  synthetic(x: FactorLike): number {
    if (isNumber(x)) {
      return x
    }

    if (isString(x)) {
      return this._lookup_value([x])
    }

    const offset = x.at(-1)
    if (isNumber(offset)) {
      return this._lookup_value(x.slice(0, -1) as BoxedFactor) + offset
    }

    return this._lookup_value(x as BoxedFactor)
  }

  // convert an array of categorical factors into synthetic coordinates
  v_synthetic(xs: Arrayable<number | Factor | [string] | OffsetFactor>): ScreenArray {
    return ScreenArray.from(xs, (x) => this.synthetic(x))
  }

  // convert a synthetic coordinate into a categorical factor
  factor(x: number): Factor | null {
    for (const f of this.factors) {
      const v = this.synthetic(f)
      if (x >= (v-0.5) && x < (v+0.5)) {
        return f
      }
    }
    return null
  }

  protected _compute_bounds(inner_padding: number): [number, number] {
    const interval = this.factors.length + inner_padding
    const padding = (() => {
      switch (this.range_padding_units) {
        case "percent": {
          return interval * this.range_padding / 2
        }
        case "absolute": {
          return this.range_padding
        }
      }
    })()
    // XXX "0 - padding" is a workaround for an assertions bug
    return [0 - padding, interval + padding]
  }

  protected _init(): void {

    const levels = compute_levels(this.factors)
    const {mapping, tops, mids, inner_padding} = (() => {
      switch (levels) {
        case 1: {
          const factors = this.factors as L1Factor[]
          return map_one_level(factors, this.factor_padding)
        }
        case 2: {
          const factors = this.factors as L2Factor[]
          return map_two_levels(factors, this.group_padding, this.factor_padding)
        }
        case 3: {
          const factors = this.factors as L3Factor[]
          return map_three_levels(factors, this.group_padding, this.subgroup_padding, this.factor_padding)
        }
      }
    })()

    this.mapping = mapping
    this.tops = tops
    this.mids = mids

    const [start, end] = this._compute_bounds(inner_padding)

    this.setv({start, end, levels}, {silent: true})

    if (this.bounds == "auto") {
      this._computed_bounds = [start, end]
    }
  }
}
