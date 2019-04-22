import {Model} from "../../model"
import {TextureRepetition} from 'core/enums'
import * as p from "core/properties"
import {Context2d} from 'core/util/canvas'

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

  static initClass(): void {
    this.prototype.type = "Texture"

    this.define<Texture.Props>({
      repetition: [ p.TextureRepetition, "repeat" ],
    })
  }

  abstract get_pattern(color: any, alpha: number, scale: number, weight: number):  (ctx: Context2d) => CanvasPattern | null

  onload(defer_func: () => void) : void {
    defer_func()
  }

}
Texture.initClass()
