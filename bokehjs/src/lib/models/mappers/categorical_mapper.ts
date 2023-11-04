import type {Mapper} from "./mapper"
import type {FactorSeq, Factor} from "../ranges/factor_range"
import type {Arrayable} from "core/types"
import {index_of, find_index} from "core/util/arrayable"
import {isArray} from "core/util/types"
import type * as p from "core/properties"

export function _cat_equals(a: ArrayLike<unknown>, b: ArrayLike<unknown>): boolean {
  if (a.length != b.length) {
    return false
  }

  const n = a.length
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}

export function cat_v_compute<T>(data: Arrayable<unknown>, factors: Arrayable<Factor>,
    targets: Arrayable<T>, values: Arrayable<T>, start: number, end: number | null, extra_value: T): void {
  let i = 0
  for (const item of data) {
    let key: number
    if (!isArray(item)) {
      key = index_of(factors, item)
    } else {
      const d = item.slice(start, end ?? undefined)

      if (d.length == 1) {
        key = index_of(factors, d[0])
      } else {
        key = find_index(factors, (x) => _cat_equals(x, d))
      }
    }

    const value = key in targets ? targets[key] : extra_value
    values[i++] = value
  }
}

export namespace CategoricalMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Mapper.Props & {
    factors: p.Property<FactorSeq>
    start: p.Property<number>
    end: p.Property<number | null>
  }
}

export interface CategoricalMapper extends CategoricalMapper.Attrs {}
