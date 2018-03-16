import {ColorMapper} from "./color_mapper"

import {Color} from "core/types"
import * as p from "core/properties"

export namespace ContinuousColorMapper {
  export interface Attrs extends ColorMapper.Attrs {
    high: number
    low: number
    high_color: Color
    low_color: Color
  }

  export interface Props extends ColorMapper.Props {}
}

export interface ContinuousColorMapper extends ContinuousColorMapper.Attrs {}

export abstract class ContinuousColorMapper extends ColorMapper {

  properties: ContinuousColorMapper.Props

  constructor(attrs?: Partial<ContinuousColorMapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ContinuousColorMapper"

    this.define({
      high:       [ p.Number ],
      low:        [ p.Number ],
      high_color: [ p.Color  ],
      low_color:  [ p.Color  ],
    })
  }
}
ContinuousColorMapper.initClass()
