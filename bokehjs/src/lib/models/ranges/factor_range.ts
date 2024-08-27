import {Range} from "./range"
import {PaddingUnits} from "core/enums"
import {Or, Str, List, Tuple} from "core/kinds"
import * as p from "core/properties"
import {Signal0} from "core/signaling"
import type {Arrayable} from "core/types"
import {ScreenArray} from "core/types"
import {every, sum} from "core/util/array"
import {isArray, isNumber, isString} from "core/util/types"

export type FactorLevel = 1 | 2 | 3

export type L1Factor = string
export type L2Factor = [string, string]
export type L3Factor = [string, string, string]

export type Factor = L1Factor | L2Factor | L3Factor
export type FactorSeq = L1Factor[] | L2Factor[] | L3Factor[]

export const Factor = Or(Str, Tuple(Str, Str), Tuple(Str, Str, Str))
export const FactorSeq = Or(List(Str), List(Tuple(Str, Str)), List(Tuple(Str, Str, Str)))

export type L1OffsetFactor = [string, number]
export type L2OffsetFactor = [string, string, number]
export type L3OffsetFactor = [string, string, string, number]

export type OffsetFactor = L1OffsetFactor | L2OffsetFactor | L3OffsetFactor

export type FactorLike = number | Factor | OffsetFactor

export type L1Mapping = Map<string, {value: number}>
export type L2Mapping = Map<string, {value: number, mapping: L1Mapping}>
export type L3Mapping = Map<string, {value: number, mapping: L2Mapping}>

export type Mapping = L1Mapping | L2Mapping | L3Mapping

export type L1MappingSpec = {mapping: L1Mapping, inner_padding: number}
export type L2MappingSpec = {mapping: L2Mapping, tops: L1Factor[], inner_padding: number}
export type L3MappingSpec = {mapping: L3Mapping, tops: L1Factor[], mids: L2Factor[], inner_padding: number}

export type MappingEntry = {value: number, mapping?: L1Mapping | L2Mapping}

type MappingFor<T>
  = T extends L1Factor ? L1Mapping
  : T extends L2Factor ? L2Mapping
  : T extends L3Factor ? L3Mapping
  : never

type BoxedAtMost<T>
  = T extends L1Factor ? [L1Factor]
  : T extends L2Factor ? [L1Factor] | L2Factor
  : T extends L3Factor ? [L1Factor] | L2Factor | L3Factor
: never

export function map_one_level(
  factors: L1Factor[],
  padding: number,
  offset: number = 0,
): L1MappingSpec {
  const mapping: L1Mapping = new Map()

  for (let i = 0; i < factors.length; i++) {
    const factor = factors[i]
    if (mapping.has(factor)) {
      throw new Error(`duplicate factor or subfactor: ${factor}`)
    }
    mapping.set(factor, {value: 0.5 + i*(1 + padding) + offset})
  }

  const inner_padding = (factors.length - 1)*padding
  return {mapping, inner_padding}
}

export function map_two_levels(
  factors: L2Factor[],
  outer_pad: number,
  factor_pad: number,
  offset: number = 0,
): L2MappingSpec {
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
  return {mapping, tops: [...mapping.keys()], inner_padding}
}

export function map_three_levels(
  factors: L3Factor[],
  outer_pad: number,
  inner_pad: number,
  factor_pad: number,
  offset: number = 0,
): L3MappingSpec {
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
    mapping.set(f0, {value: subtot/n, mapping: sub.mapping})
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

const is_l1 = (x: unknown) => isString(x)
const is_l2 = (x: unknown) => isArray(x) && x.length == 2 && isString(x[0]) && isString(x[1])
const is_l3 = (x: unknown) => isArray(x) && x.length == 3 && isString(x[0]) && isString(x[1]) && isString(x[2])

export abstract class FactorMapper<FactorType> {
  readonly levels: FactorLevel
  readonly mids: L2Factor[] | null
  readonly tops: L1Factor[] | null
  readonly inner_padding: number

  protected readonly mapping: MappingFor<FactorType>

  constructor(
    {levels, mapping, tops = null, mids = null, inner_padding}: {
      levels: FactorLevel
      mapping: MappingFor<FactorType>
      tops?: L1Factor[] | null
      mids?: L2Factor[] | null
      inner_padding: number
    },
  ) {
    this.levels = levels
    this.mapping = mapping
    this.tops = tops
    this.mids = mids
    this.inner_padding = inner_padding
  }

  static compute_levels(factors: Factor[]): FactorLevel {
    if (every(factors, is_l1)) {
      return 1
    }
    if (every(factors, is_l2)) {
      return 2
    }
    if (every(factors, is_l3)) {
      return 3
    }
    throw TypeError("factor levels are inconsistent")
  }

  static for(range: FactorRange): L1FactorMapper | L2FactorMapper | L3FactorMapper {
    switch (this.compute_levels(range.factors)) {
      case 1: {
        return new L1FactorMapper(range)
      }
      case 2: {
        return new L2FactorMapper(range)
      }
      case 3: {
        return new L3FactorMapper(range)
      }
    }
  }

  map(x: FactorLike): number {
    if (isNumber(x)) {
      return x
    }

    const [boxed, offset] = (() => {
      if (isString(x)) {
        return [[x], 0]
      }
      const last = x[x.length-1]
      if (isNumber(last)) {
        return [x.slice(0, -1), last]
      }
      return [x, 0]
    })()

    if (boxed.length > this.levels) {
      throw new Error(`Attempted to map ${boxed.length} levels of factors with an L${this.levels}FactorMap`)
    }

    return this.lookup_value(boxed as BoxedAtMost<FactorType>) + offset
  }

  private lookup_value(x: BoxedAtMost<FactorType>): number {
    return this.lookup_entry(x)?.value ?? NaN
  }

  protected abstract lookup_entry(x: BoxedAtMost<FactorType>): MappingEntry | null
}

class L1FactorMapper extends FactorMapper<L1Factor> {
  constructor(range: FactorRange) {
    const {factors, factor_padding} = range
    const spec = map_one_level(factors as L1Factor[], factor_padding)
    super({levels: 1, ...spec})
  }

  protected lookup_entry(x: BoxedAtMost<L1Factor>): MappingEntry | null {
    const [f0] = x
    return this.mapping.get(f0) ?? null
  }
}

class L2FactorMapper extends FactorMapper<L2Factor> {
  constructor(range: FactorRange) {
    const {factors, group_padding, factor_padding} = range
    const spec = map_two_levels(factors as L2Factor[], group_padding, factor_padding)
    super({levels: 2, ...spec})
  }

  protected lookup_entry(x: BoxedAtMost<L2Factor>): MappingEntry | null {
    if (x.length == 1) {
      const [f0] = x
      return this.mapping.get(f0) ?? null
    } else {
      const [f0, f1] = x
      return this.mapping.get(f0)?.mapping.get(f1) ?? null
    }
  }
}

class L3FactorMapper extends FactorMapper<L3Factor> {
  constructor(range: FactorRange) {
    const {factors, group_padding, subgroup_padding, factor_padding} = range
    const spec = map_three_levels(factors as L3Factor[], group_padding, subgroup_padding, factor_padding)
    super({levels: 3, ...spec})
  }

  protected lookup_entry(x: BoxedAtMost<L3Factor>): MappingEntry | null {
    if (x.length == 1) {
      const [f0] = x
      return this.mapping.get(f0) ?? null
    } else if (x.length == 2) {
      const [f0, f1] = x
      return this.mapping.get(f0)?.mapping.get(f1) ?? null
    } else {
      const [f0, f1, f2] = x
      return this.mapping.get(f0)?.mapping.get(f1)?.mapping.get(f2) ?? null
    }
  }
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
  }

  mapper: L1FactorMapper | L2FactorMapper | L3FactorMapper

  get min(): number {
    return this.start
  }

  get max(): number {
    return this.end
  }

  override initialize(): void {
    super.initialize()
    this.configure()
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
    this.configure()
    this.invalidate_synthetic.emit()
  }

  /** Convert a categorical factor into a synthetic coordinate. */
  synthetic(x: FactorLike): number {
    return this.mapper.map(x)
  }

  /** Convert an array of categorical factors into synthetic coordinates. */
  v_synthetic(xs: Arrayable<FactorLike>): ScreenArray {
    return ScreenArray.from(xs, (x) => this.synthetic(x))
  }

  /** Convert a synthetic coordinate into a categorical factor. */
  factor(x: number): Factor | null {
    for (const f of this.factors) {
      const v = this.mapper.map(f)
      if (x >= (v-0.5) && x < (v+0.5)) {
        return f
      }
    }
    return null
  }

  private compute_bounds(inner_padding: number): [number, number] {
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
    return [-padding, interval + padding]
  }

  private configure(): void {
    this.mapper = FactorMapper.for(this)

    const [start, end] = this.compute_bounds(this.mapper.inner_padding)

    this.setv({start, end}, {silent: true})

    if (this.bounds == "auto") {
      this._computed_bounds = [start, end]
    }
  }
}
