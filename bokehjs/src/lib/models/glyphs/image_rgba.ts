import {ImageBase, ImageBaseView, ImageDataBase} from "./image_base"
import {Arrayable, TypedArray} from "core/types"
import {Class} from "core/class"
import * as p from "core/properties"
import {concat} from "core/util/array"
import {Context2d} from "core/util/canvas"

export interface ImageRGBAData extends ImageDataBase {}

export interface ImageRGBAView extends ImageRGBAData {}

export class ImageRGBAView extends ImageBaseView {
  model: ImageRGBA
  visuals: ImageRGBA.Visuals

  protected _width: Arrayable<number>
  protected _height: Arrayable<number>

  initialize(): void {
    super.initialize()
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_render())
  }

  protected _set_data(indices: number[] | null): void {
    this._set_width_heigh_data()

    for (let i = 0, end = this._image.length; i < end; i++) {
      if (indices != null && indices.indexOf(i) < 0)
        continue

      let buf: ArrayBuffer
      if (this._image_shape != null && this._image_shape[i].length > 0) {
        buf = (this._image[i] as TypedArray).buffer
        const shape = this._image_shape[i]
        this._height[i] = shape[0]
        this._width[i] = shape[1]
      } else {
        const _image = this._image[i] as number[][]
        const flat = concat(_image)
        buf = new ArrayBuffer(flat.length * 4)
        const color = new Uint32Array(buf)
        for (let j = 0, endj = flat.length; j < endj; j++) {
          color[j] = flat[j]
        }
        this._height[i] = _image.length
        this._width[i] = _image[0].length
      }

      const buf8 = new Uint8Array(buf)
      this._set_image_data_from_buffer(i, buf8)

    }
  }

  protected _render(ctx: Context2d, indices: number[], {image_data, sx, sy, sw, sh}: ImageRGBAData): void {
    const old_smoothing = ctx.getImageSmoothingEnabled()
    ctx.setImageSmoothingEnabled(false)

    ctx.globalAlpha = this.model.global_alpha

    for (const i of indices) {
      if (isNaN(sx[i] + sy[i] + sw[i] + sh[i]))
        continue

      const y_offset = sy[i]

      ctx.translate(0, y_offset)
      ctx.scale(1, -1)
      ctx.translate(0, -y_offset)
      ctx.drawImage(image_data[i], sx[i]|0, sy[i]|0, sw[i], sh[i])
      ctx.translate(0, y_offset)
      ctx.scale(1, -1)
      ctx.translate(0, -y_offset)
    }

    ctx.setImageSmoothingEnabled(old_smoothing)
  }
}

export namespace ImageRGBA {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ImageBase.Props & {
    image: p.NumberSpec
    dw: p.DistanceSpec
    dh: p.DistanceSpec
    global_alpha: p.Property<number>
    dilate: p.Property<boolean>
  }

  export type Visuals = ImageBase.Visuals
}

export interface ImageRGBA extends ImageRGBA.Attrs {}

export class ImageRGBA extends ImageBase {
  properties: ImageRGBA.Props
  default_view: Class<ImageRGBAView>

  constructor(attrs?: Partial<ImageRGBA.Attrs>) {
    super(attrs)
  }

  static init_ImageRGBA(): void {
    this.prototype.default_view = ImageRGBAView
  }
}
