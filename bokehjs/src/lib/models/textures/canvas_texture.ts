import {Texture} from "./texture"
import type * as p from "core/properties"
import type {Color} from "core/types"
import type {PatternSource} from "core/visuals/patterns"
import {use_strict} from "core/util/string"

export namespace CanvasTexture {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Texture.Props & {
    code: p.Property<string>
  }
}

export interface CanvasTexture extends CanvasTexture.Attrs {}

export abstract class CanvasTexture extends Texture {
  declare properties: CanvasTexture.Props

  constructor(attrs?: Partial<CanvasTexture.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CanvasTexture.Props>(({Str}) => ({
      code: [ Str ],
    }))
  }

  get func(): Function {
    const code = use_strict(this.code)
    return new Function("ctx", "color", "scale", "weight", code)
  }

  get_pattern(color: Color, scale: number, weight: number): PatternSource {
    const canvas = document.createElement("canvas")
    canvas.width = scale
    canvas.height = scale
    const pattern_ctx = canvas.getContext("2d")
    this.func.call(this, pattern_ctx, color, scale, weight)
    return canvas
  }
}
