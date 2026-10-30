import type {CategoricalMapper} from "./categorical_mapper"
import {cat_v_compute} from "./categorical_mapper"
import type {PaletteMixin} from "./color_mapper"
import {ColorMapper} from "./color_mapper"
import type {Factor} from "../ranges/factor_range"
import {FactorSeq} from "../ranges/factor_range"

import type * as p from "core/properties"
import type {Arrayable, Color, uint32} from "core/types"

export namespace CategoricalColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColorMapper.Props & PaletteMixin.Props & CategoricalMapper.Props
}

export interface CategoricalColorMapper extends CategoricalColorMapper.Attrs {}

export class CategoricalColorMapper extends ColorMapper {
  declare properties: CategoricalColorMapper.Props

  static {
    this.define<CategoricalColorMapper.Props>(({Int, Nullable, Color, Palette}) => ({
      palette:   [ Palette ],
      nan_color: [ Color, "gray" ],
      factors:   [ FactorSeq ],
      start:     [ Int, 0 ],
      end:       [ Nullable(Int), null ],
    }))
  }

  override get display_mapper(): this {
    return this
  }

  protected _palette(): Color[] {
    return this.palette
  }

  protected _colors<T>(conv: (c: Color) => T): {nan_color: T} {
    return {nan_color: conv(this.nan_color)}
  }

  protected _v_compute(data: Arrayable<Factor | number | null>, values: Arrayable<uint32>,
      palette: Arrayable<uint32>, {nan_color}: {nan_color: uint32}): void {
    cat_v_compute(data, this.factors, palette, values, this.start, this.end, nan_color)
  }
}
