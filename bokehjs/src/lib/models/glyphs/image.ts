import {ImageBase, ImageBaseView, ImageDataBase} from "./image_base"
import {ColorMapper} from "../mappers/color_mapper"
import {LinearColorMapper} from "../mappers/linear_color_mapper"
import {Class} from "core/class"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {concat} from "core/util/array"
import {Context2d} from "core/util/canvas"
import * as hittest from "core/hittest"
import {Selection} from "../selections/selection"
import {PointGeometry} from "core/geometry"
import { ImageRGBAData } from './image_rgba'

export interface ImageView extends ImageDataBase {}

export interface ImageIndex {
  index: number
  dim1: number
  dim2: number
  flat_index: number
}

export class ImageView extends ImageBaseView {
  model: Image
  visuals: Image.Visuals

  protected _width: Arrayable<number>
  protected _height: Arrayable<number>

  initialize(): void {
    super.initialize()
    this.connect(this.model.color_mapper.change, () => this._update_image())
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_render())
  }

  protected _update_image(): void {
    // Only reset image_data if already initialized
    if (this.image_data != null) {
      this._set_data()
      this.renderer.plot_view.request_render()
    }
  }

  _image_index(index : number, x: number, y : number) : ImageIndex {
    const [l,r,t,b] = this._lrtb(index)
    const width = this._width[index]
    const height = this._height[index]
    const dx = (r - l) / width
    const dy = (t - b) / height
    const dim1 = Math.floor((x - l) / dx)
    const dim2 = Math.floor((y - b) / dy)
    return {index, dim1, dim2, flat_index: dim2*width + dim1}
  }

  _hit_point(geometry: PointGeometry) : Selection {
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)
    const bbox = hittest.validate_bbox_coords([x, x], [y, y])
    const candidates = this.index.indices(bbox)
    const result = hittest.create_empty_hit_test_result()

    result.image_indices = []
    for (const index of candidates) {
      if ((sx != Infinity) && (sy != Infinity)) {
        result.image_indices.push(this._image_index(index, x,y))
      }
    }
    return result
  }

  protected _set_data(): void {
    this._set_width_heigh_data()

    const cmap = this.model.color_mapper.rgba_mapper

    for (let i = 0, end = this._image.length; i < end; i++) {
      let img: Arrayable<number>
      if (this._image_shape != null && this._image_shape[i].length > 0) {
        img = this._image[i] as Arrayable<number>
        const shape = this._image_shape[i]
        this._height[i] = shape[0]
        this._width[i] = shape[1]
      } else {
        const _image = this._image[i] as number[][]
        img = concat(_image)
        this._height[i] = _image.length
        this._width[i] = _image[0].length
      }

      const buf8 = cmap.v_compute(img)
      this._set_image_data_from_buffer(i, buf8)

    }
  }

  protected _render(ctx: Context2d, indices: number[], {image_data, sx, sy, sw, sh}: ImageRGBAData): void {
    const old_smoothing = ctx.getImageSmoothingEnabled()
    ctx.setImageSmoothingEnabled(false)

    ctx.globalAlpha = this.model.global_alpha

    for (const i of indices) {
      if (image_data[i] == null)
        continue

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

// NOTE: this needs to be redefined here, because palettes are located in bokeh-api.js bundle
const Greys9 = () => ["#000000", "#252525", "#525252", "#737373", "#969696", "#bdbdbd", "#d9d9d9", "#f0f0f0", "#ffffff"]

export namespace Image {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ImageBase.Props & {
    image: p.NumberSpec
    dw: p.DistanceSpec
    dh: p.DistanceSpec
    global_alpha: p.Property<number>
    dilate: p.Property<boolean>
    color_mapper: p.Property<ColorMapper>
  }

  export type Visuals = ImageBase.Visuals
}

export interface Image extends Image.Attrs {}

export class Image extends ImageBase {
  properties: Image.Props
  default_view: Class<ImageView>

  constructor(attrs?: Partial<Image.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Image'
    this.prototype.default_view = ImageView

    this.define<Image.Props>({
      color_mapper: [ p.Instance,  () => new LinearColorMapper({palette: Greys9()}) ],
    })
  }
}
Image.initClass()
