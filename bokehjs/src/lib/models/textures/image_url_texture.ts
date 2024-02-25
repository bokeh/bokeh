import {Texture} from "./texture"
import type * as p from "core/properties"
import type {Color} from "core/types"
import type {PatternSource} from "core/visuals/patterns"
import {ImageLoader} from "core/util/image"

export namespace ImageURLTexture {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Texture.Props & {
    url: p.Property<string>
  }
}

export interface ImageURLTexture extends ImageURLTexture.Attrs {}

export class ImageURLTexture extends Texture {
  declare properties: ImageURLTexture.Props

  constructor(attrs?: Partial<ImageURLTexture.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ImageURLTexture.Props>(({Str}) => ({
      url: [ Str ],
    }))
  }

  private _loader: ImageLoader

  override initialize(): void {
    super.initialize()
    this._loader = new ImageLoader(this.url)
  }

  get_pattern(_color: Color, _scale: number, _weight: number): PatternSource | Promise<PatternSource> {
    const {_loader} = this
    return this._loader.finished ? _loader.image : _loader.promise
  }
}
