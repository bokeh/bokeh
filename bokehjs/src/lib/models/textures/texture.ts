import {Model} from "../../model"
import {Color} from "core/types"
import {TextureRepetition} from "core/enums"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export namespace Texture {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    repetition: p.Property<TextureRepetition>
  }
}

export interface Texture extends Texture.Attrs {}

export abstract class Texture extends Model {
  properties: Texture.Props

  constructor(attrs?: Partial<Texture.Attrs>) {
    super(attrs)
  }

  static init_Texture(): void {
    this.define<Texture.Props>({
      repetition: [ p.TextureRepetition, "repeat" ],
    })
  }

  abstract get_pattern(color: Color, alpha: number, scale: number, weight: number): (ctx: Context2d) => CanvasPattern | null

  onload(defer_func: () => void): void {
    defer_func()
  }
}
