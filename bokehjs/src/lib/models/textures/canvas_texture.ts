import {Texture} from "./texture"
import * as p from "core/properties"
import {Context2d} from 'core/util/canvas'
import {use_strict} from 'core/util/string'

export namespace CanvasTexture {
    export type Attrs = p.AttrsOf<Props>

    export type Props = Texture.Props  & {
        code: p.Property<string>
    }
  }

export interface CanvasTexture extends CanvasTexture.Attrs {}

export abstract class CanvasTexture extends Texture {
  properties: CanvasTexture.Props

  constructor(attrs?: Partial<CanvasTexture.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.define<CanvasTexture.Props>({
      code: [ p.String ],
    })
  }

  get func(): Function {
    const code = use_strict(this.code)
    return new Function("ctx", "color", "scale", "weight", "require", "exports", code)
  }

  get_pattern(color: any, scale: number, weight: number): (ctx: Context2d) => CanvasPattern | null {
    return (ctx: Context2d): CanvasPattern | null => {
      const canvas = document.createElement('canvas')
      canvas.width = scale
      canvas.height = scale
      const pattern_ctx = canvas.getContext('2d')
      this.func.call(this, pattern_ctx, color, scale, weight, require, {})
      return ctx.createPattern(canvas, this.repetition)
    }
  }

}
CanvasTexture.initClass()
