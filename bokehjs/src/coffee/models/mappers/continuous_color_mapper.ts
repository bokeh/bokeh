import {ColorMapper} from "./color_mapper"
import {Arrayable, Color} from "core/types"
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

  protected _high_color: number | undefined
  protected _low_color: number | undefined

  initialize(): void {
    super.initialize()
    this._high_color = this.high_color != null ? this._convert_color(this.high_color) : undefined
    this._low_color = this.low_color != null ? this._convert_color(this.low_color) : undefined
  }

  protected abstract _get_values(data: Arrayable<number>, palette: Float32Array, image_glyph?: boolean): Arrayable<number>
}
ContinuousColorMapper.initClass()
