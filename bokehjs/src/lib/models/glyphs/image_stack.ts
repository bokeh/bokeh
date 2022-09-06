import {ImageBase, ImageBaseView, ImageDataBase} from "./image_base"
import {ColorMapper} from "../mappers/color_mapper"
import {LinearColorMapper} from "../mappers/linear_color_mapper"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {assert} from "core/util/assert"

export type ImageStackData = ImageDataBase

export interface ImageStackView extends ImageData {}

export class ImageStackView extends ImageBaseView {
  override model: ImageStack
  override visuals: ImageStack.Visuals

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.color_mapper.change, () => this._update_image())
  }

  protected override _set_data(indices: number[] | null): void {

    // Based on ImageBase._set_data (which is for 2D images)

    this._set_width_heigh_data()

    for (let i = 0, end = this.image.length; i < end; i++) {
      if (indices != null && indices.indexOf(i) < 0)
        continue

      const img = this.image.get(i)
      assert(img.dimension == 3, "expected a 3D array")  // This is the only difference!!!
      this._height[i] = img.shape[0]
      this._width[i] = img.shape[1]

      const buf8 = this._flat_img_to_buf8(img, img.shape[2])
      this._set_image_data_from_buffer(i, buf8)
    }
  }

  protected _update_image(): void {
    // Only reset image_data if already initialized
    if (this.image_data != null) {
      this._set_data(null)
      this.renderer.request_render()
    }
  }

  protected _flat_img_to_buf8(img: Arrayable<number>, length_divisor: number): Uint8ClampedArray {
    const mapper = this.model.color_mapper
    const cmap = mapper.rgba_mapper
    return cmap.v_compute(img, length_divisor)         // hard-coded length_divisor arg
  }
}

// NOTE: this needs to be redefined here, because palettes are located in bokeh-api.js bundle
const Greys9 = () => ["#000000", "#252525", "#525252", "#737373", "#969696", "#bdbdbd", "#d9d9d9", "#f0f0f0", "#ffffff"]

export namespace ImageStack {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ImageBase.Props & {
    color_mapper: p.Property<ColorMapper>
  }

  export type Visuals = ImageBase.Visuals
}

export interface ImageStack extends ImageStack.Attrs {}

export class ImageStack extends ImageBase {
  override properties: ImageStack.Props
  override __view_type__: ImageStackView

  constructor(attrs?: Partial<ImageStack.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ImageStackView

    this.define<ImageStack.Props>(({Ref}) => ({
      color_mapper: [ Ref(ColorMapper), () => new LinearColorMapper({palette: Greys9()}) ],
    }))
  }
}
