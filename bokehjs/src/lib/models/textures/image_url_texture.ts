import {Texture} from "./texture"
import * as p from "core/properties"
import {Context2d} from 'core/util/canvas'
import {ImageLoader} from "core/util/image"

export namespace ImageURLTexture {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Texture.Props  & {
    url: p.Property<string>
  }
}

export interface ImageURLTexture extends ImageURLTexture.Attrs {}

export abstract class ImageURLTexture extends Texture {
  properties: ImageURLTexture.Props

  constructor(attrs?: Partial<ImageURLTexture.Attrs>) {
    super(attrs)
  }

  static init_ImageURLTexture(): void {
    this.define<ImageURLTexture.Props>({
      url: [ p.String ],
    })
  }

  initialize(): void {
    super.initialize()
    this._loader = new ImageLoader(this.url)
  }

  get_pattern(_color: any, _scale: number, _weight: number): (ctx: Context2d) => CanvasPattern | null {
    return (ctx: Context2d): CanvasPattern | null => {
      if (!this._loader.finished) {
        return null
      }
      return ctx.createPattern(this._loader.image, this.repetition)
    }
  }

  onload(defer_func: () => void): void {
    this._loader.promise.then(() => defer_func())
  }

  private _loader: ImageLoader
}
