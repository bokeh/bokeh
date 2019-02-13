import {Mapper} from "./mapper"
import {Factor, L1Factor, L2Factor, L3Factor} from "../ranges/factor_range"
import {Arrayable, ArrayableOf} from "core/types"
import {index_of, find_index} from "core/util/arrayable"
import {isString} from "core/util/types"
import * as p from "core/properties"

export function _cat_equals(a: Arrayable<any>, b: Arrayable<any>): boolean {
  if (a.length != b.length)
    return false

  for (let i = 0, end = a.length; i < end; i++) {
    if (a[i] !== b[i])
      return false
  }

  return true
}

export function cat_v_compute<T>(data: ArrayableOf<Factor>, factors: ArrayableOf<Factor>,
    targets: Arrayable<T>, values: Arrayable<T>, start: number, end: number, extra_value: T): void {

  for (let i = 0, N = data.length; i < N; i++) {
    let d = data[i]

    let key: number
    if (isString(d))
      key = index_of(factors as Arrayable<L1Factor>, d)
    else {
      if (start != null) {
        if (end != null)
          d = d.slice(start, end) as Factor
        else
          d = d.slice(start) as Factor
      } else if (end != null)
        d = d.slice(0, end) as Factor

      if (d.length == 1)
        key = index_of(factors as Arrayable<L1Factor>, d[0])
      else
        key = find_index(factors as Arrayable<L2Factor | L3Factor>, (x) => _cat_equals(x, d))
    }

    let value: T
    if (key < 0 || key >= targets.length)
      value = extra_value
    else
      value = targets[key]

    values[i] = value
  }
}

export namespace CategoricalMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Mapper.Props & {
    factors: p.Property<ArrayableOf<Factor>>
    start: p.Property<number>
    end: p.Property<number>
  }
}

export interface CategoricalMapper extends CategoricalMapper.Attrs {}
