import {Mapper} from "./mapper"
import {Arrayable} from "core/types"
import {Factor} from "../ranges/factor_range"
import {findIndex} from "core/util/array"
import {isString} from "core/util/types"

export function _cat_equals(a: Arrayable<any>, b: Arrayable<any>): boolean {
  if (a.length != b.length)
    return false

  for (let i = 0, end = a.length; i < end; i++) {
    if (a[i] !== b[i])
      return false
  }

  return true
}

export function cat_v_compute<T>(data: Arrayable<Factor>, factors: string[], targets: Arrayable<T>, values: Arrayable<T>,
  start: number, end: number, extra_value: T): void {

  for (let i = 0, N = data.length; i < N; i++) {
    let d = data[i]

    let key: number
    if (isString(d))
      key = factors.indexOf(d)
    else {
      if (start != null) {
        if (end != null)
          d = d.slice(start, end) as Factor
        else
          d = d.slice(start) as Factor
      } else if (end != null)
        d = d.slice(0, end) as Factor

      if (d.length == 1)
        key = factors.indexOf(d[0])
      else
        key = findIndex(factors, (x) => _cat_equals(x, d))
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
  export interface Attrs extends Mapper.Attrs {
    factors: string[]
    start: number
    end: number
  }

  export interface Props extends Mapper.Props {}
}

export interface CategoricalMapper extends CategoricalMapper.Attrs {}
