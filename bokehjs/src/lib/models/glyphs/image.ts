import {ImageBase, ImageBaseView} from "./image_base"
import {ColorMapper} from "../mappers/color_mapper"
import {LinearColorMapper} from "../mappers/linear_color_mapper"
import type {NDArrayType} from "core/util/ndarray"
import type * as p from "core/properties"
import type {ImageGL} from "./webgl/image"

export interface ImageView extends Image.Data {}

export class ImageView extends ImageBaseView {
  declare model: Image
  declare visuals: Image.Visuals

  /** @internal */
  declare glglyph?: ImageGL

  override async load_glglyph() {
    const {ImageGL} = await import("./webgl/image")
    return ImageGL
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.color_mapper.change, () => this._update_image())
  }

  protected _update_image(): void {
    if (this.has_webgl()) {
      this.glglyph.set_image_changed()
    }

    // Only reset image_data if already initialized
    if (this.image_data != null) {
      this._set_data(null)
      this.renderer.request_paint()
    }
  }

  protected override get _can_inherit_image_data(): boolean {
    return super._can_inherit_image_data &&
      this._can_inherit_from(this.model.properties.color_mapper, this.base)
  }

  protected _flat_img_to_buf8(img: NDArrayType<number>): Uint8ClampedArray {
    const cmap = this.model.color_mapper.rgba_mapper
    return cmap.v_compute(img)
  }
}

// NOTE: this needs to be redefined here, because palettes are located in bokeh-api.js bundle
const Greys9 = () => ["#000000", "#252525", "#525252", "#737373", "#969696", "#bdbdbd", "#d9d9d9", "#f0f0f0", "#ffffff"]

export namespace Image {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ImageBase.Props & {
    color_mapper: p.Property<ColorMapper>
  }

  export type Visuals = ImageBase.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface Image extends Image.Attrs {}

export class Image extends ImageBase {
  declare properties: Image.Props
  declare __view_type__: ImageView

  constructor(attrs?: Partial<Image.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ImageView

    this.define<Image.Props>(({Ref}) => ({
      color_mapper: [ Ref(ColorMapper), () => new LinearColorMapper({palette: Greys9()}) ],
    }))
  }
}
