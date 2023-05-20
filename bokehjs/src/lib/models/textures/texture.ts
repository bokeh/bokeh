import {Model} from "../../model"
import type {PatternSource} from "core/visuals/patterns"
import type {Color} from "core/types"
import {TextureRepetition} from "core/enums"
import type * as p from "core/properties"

export namespace Texture {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    repetition: p.Property<TextureRepetition>
  }
}

export interface Texture extends Texture.Attrs {}

export abstract class Texture extends Model {
  declare properties: Texture.Props

  constructor(attrs?: Partial<Texture.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Texture.Props>(() => ({
      repetition: [ TextureRepetition, "repeat" ],
    }))
  }

  abstract get_pattern(color: Color, alpha: number, scale: number, weight: number): PatternSource | Promise<PatternSource>
}
