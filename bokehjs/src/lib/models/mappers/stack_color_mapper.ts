import {ColorMapper} from "./color_mapper"
import type * as p from "core/properties"
import type {Arrayable} from "core/types"

export namespace StackColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColorMapper.Props
}

export interface StackColorMapper extends StackColorMapper.Attrs {}

export abstract class StackColorMapper extends ColorMapper {
  declare properties: StackColorMapper.Props

  /**
   * Called by `ImageStack` with the images whose data may have changed,
   * including in place, so that anything computed from their previous data
   * can be dropped.
   */
  data_changed(_images: Iterable<Arrayable<number>>): void {}
}
