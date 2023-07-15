import {ColorMapper, _convert_palette, _convert_color} from "./color_mapper"
import type * as p from "core/properties"

export namespace StackColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColorMapper.Props
}

export interface StackColorMapper extends StackColorMapper.Attrs {}

export abstract class StackColorMapper extends ColorMapper {
  declare properties: StackColorMapper.Props

  constructor(attrs?: Partial<StackColorMapper.Attrs>) {
    super(attrs)
  }
}
