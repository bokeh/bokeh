import {ColorMapper} from "./color_mapper"
import {Factor} from "../ranges/factor_range"

import * as p from "core/properties"
import {Arrayable} from "core/types"
import {findIndex} from "core/util/array"
import {isString} from "core/util/types"

function _equals(a: Arrayable<any>, b: Arrayable<any>): boolean {
  if (a.length != b.length)
    return false

  for (let i = 0, end = a.length; i < end; i++) {
    if (a[i] !== b[i])
      return false
  }

  return true
}

export namespace CategoricalColorMapper {
  export interface Attrs extends ColorMapper.Attrs {
    factors: string[]
    start: number
    end: number
  }

  export interface Props extends ColorMapper.Props {}
}

export interface CategoricalColorMapper extends CategoricalColorMapper.Attrs {}

export class CategoricalColorMapper extends ColorMapper {

  properties: CategoricalColorMapper.Props

  constructor(attrs?: Partial<CategoricalColorMapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "CategoricalColorMapper"

    this.define({
      factors: [ p.Array     ],
      start:   [ p.Number, 0 ],
      end:     [ p.Number    ],
    })
  }

  protected _v_compute<T>(data: Arrayable<Factor>, values: Arrayable<T>,
      palette: Arrayable<T>, {nan_color}: {nan_color: T}): void {

    for (let i = 0, end = data.length; i < end; i++) {
      let d = data[i]

      let key: number
      if (isString(d))
        key = this.factors.indexOf(d)
      else {
        if (this.start != null) {
          if (this.end != null)
            d = d.slice(this.start, this.end) as Factor
          else
            d = d.slice(this.start) as Factor
        } else if (this.end != null)
          d = d.slice(0, this.end) as Factor

        if (d.length == 1)
          key = this.factors.indexOf(d[0])
        else
          key = findIndex(this.factors, (x) => _equals(x, d))
      }

      let color: T
      if (key < 0 || key >= palette.length)
        color = nan_color
      else
        color = palette[key]

      values[i] = color
    }
  }
}
CategoricalColorMapper.initClass()
