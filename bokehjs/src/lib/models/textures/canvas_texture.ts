import {Texture} from "./texture"
import * as p from "core/properties"
import {Color} from "core/types"
import {PatternSource} from "core/visuals/patterns"
import {use_strict} from "core/util/string"

export namespace CanvasTexture {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Texture.Props & {
    code: p.Property<string>
  }
}

export interface CanvasTexture extends CanvasTexture.Attrs {}

export abstract class CanvasTexture extends Texture {
  override properties: CanvasTexture.Props

  constructor(attrs?: Partial<CanvasTexture.Attrs>) {
    super(attrs)
  }

  static init_CanvasTexture(): void {
    this.define<CanvasTexture.Props>(({String}) => ({
      code: [ String ],
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
