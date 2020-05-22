import {ImageBase, ImageBaseView, ImageDataBase} from "./image_base"
import {ColorMapper} from "../mappers/color_mapper"
import {LinearColorMapper} from "../mappers/linear_color_mapper"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export interface ImageData extends ImageDataBase {}

export interface ImageView extends ImageData {}

export class ImageView extends ImageBaseView {
  model: Image
  visuals: Image.Visuals

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.color_mapper.change, () => this._update_image())
  }

  protected _update_image(): void {
    // Only reset image_data if already initialized
    if (this.image_data != null) {
      this._set_data(null)
      this.renderer.plot_view.request_render()
    }
  }

  protected _flat_img_to_buf8(img: Arrayable<number>): Uint8Array {
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
}

export interface Image extends Image.Attrs {}

export class Image extends ImageBase {
  properties: Image.Props
  __view_type__: ImageView

  constructor(attrs?: Partial<Image.Attrs>) {
    super(attrs)
  }

  static init_Image(): void {
    this.prototype.default_view = ImageView

    this.define<Image.Props>({
      color_mapper: [ p.Instance, () => new LinearColorMapper({palette: Greys9()}) ],
    })
  }
}
