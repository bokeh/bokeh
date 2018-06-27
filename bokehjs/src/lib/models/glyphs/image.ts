import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {DistanceSpec, NumberSpec} from "core/vectorization"
import {ColorMapper} from "../mappers/color_mapper"
import {LinearColorMapper} from "../mappers/linear_color_mapper"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {max, concat} from "core/util/array"
import {Context2d} from "core/util/canvas"
import {Rect} from "core/util/spatial"
import {SpatialIndex} from "core/util/spatial"
import * as hittest from "core/hittest";
import {Selection} from "../selections/selection";
import {PointGeometry} from "core/geometry"

// XXX: because ImageData is a global
export interface _ImageData extends XYGlyphData {
  image_data: Arrayable<HTMLCanvasElement>

  _image: Arrayable<Arrayable<number> | number[][]>
  _dw: Arrayable<number>
  _dh: Arrayable<number>

  _image_shape?: Arrayable<[number, number]>

  sw: Arrayable<number>
  sh: Arrayable<number>

  max_dw: number
  max_dh: number
}

export interface ImageView extends _ImageData {}


export interface ImageIndex {
  index: number
  dim1: number
  dim2: number
  flat_index: number
}

export class ImageView extends XYGlyphView {
  model: Image
  visuals: Image.Visuals

  protected _width: Arrayable<number>
  protected _height: Arrayable<number>

  initialize(options: any): void {
    super.initialize(options)
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

  _index_data(): SpatialIndex {
    const points = []
    for (let i = 0, end = this._x.length; i < end; i++) {
      const [l, r, t, b] = this._lrtb(i)
      if (isNaN(l + r + t + b) || !isFinite(l + r + t + b)) {
        continue
      }
      points.push({minX: l, minY: b, maxX: r, maxY: t, i})
    }
    return new SpatialIndex(points)
  }

  _lrtb(i: number) : [number, number, number, number]{
    const xr = this.renderer.xscale.source_range
    const x1 = this._x[i]
    const x2 = xr.is_reversed ? x1 - this._dw[i] : x1 + this._dw[i]

    const yr = this.renderer.yscale.source_range
    const y1 = this._y[i]
    const y2 = yr.is_reversed ? y1 - this._dh[i] : y1 + this._dh[i]

    const [l,r] = x1 < x2 ? [x1,x2] : [x2,x1]
    const [b,t] = y1 < y2 ? [y1,y2] : [y2,y1]
    return [l, r, t, b]
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
    if (this.image_data == null || this.image_data.length != this._image.length)
      this.image_data = new Array(this._image.length)

    if (this._width == null || this._width.length != this._image.length)
      this._width = new Array(this._image.length)

    if (this._height == null || this._height.length != this._image.length)
      this._height = new Array(this._image.length)

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

      const _image_data = this.image_data[i]
      let canvas: HTMLCanvasElement
      if (_image_data != null && _image_data.width == this._width[i] &&
                                 _image_data.height == this._height[i])
        canvas = _image_data
      else {
        canvas = document.createElement('canvas')
        canvas.width = this._width[i]
        canvas.height = this._height[i]
      }

      const ctx = canvas.getContext('2d')!
      const image_data = ctx.getImageData(0, 0, this._width[i], this._height[i])
      const buf8 = cmap.v_compute(img)
      image_data.data.set(buf8)
      ctx.putImageData(image_data, 0, 0)
      this.image_data[i] = canvas

      this.max_dw = 0
      if (this.model.properties.dw.units == "data")
        this.max_dw = max(this._dw)

      this.max_dh = 0
      if (this.model.properties.dh.units == "data")
        this.max_dh = max(this._dh)
    }
  }

  protected _map_data(): void {
    switch (this.model.properties.dw.units) {
      case "data": {
        this.sw = this.sdist(this.renderer.xscale, this._x, this._dw, 'edge', this.model.dilate)
        break
      }
      case "screen": {
        this.sw = this._dw
        break
      }
    }

    switch (this.model.properties.dh.units) {
      case "data": {
        this.sh = this.sdist(this.renderer.yscale, this._y, this._dh, 'edge', this.model.dilate)
        break
      }
      case "screen": {
        this.sh = this._dh
        break
      }
    }
  }

  protected _render(ctx: Context2d, indices: number[], {image_data, sx, sy, sw, sh}: _ImageData): void {
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

  bounds(): Rect {
    const {bbox} = this.index
    bbox.maxX += this.max_dw
    bbox.maxY += this.max_dh
    return bbox
  }
}

// NOTE: this needs to be redefined here, because palettes are located in bokeh-api.js bundle
const Greys9 = () => ["#000000", "#252525", "#525252", "#737373", "#969696", "#bdbdbd", "#d9d9d9", "#f0f0f0", "#ffffff"]

export namespace Image {
  export interface Attrs extends XYGlyph.Attrs {
    image: NumberSpec
    dw: DistanceSpec
    dh: DistanceSpec
    global_alpha: number
    dilate: boolean
    color_mapper: ColorMapper
  }

  export interface Props extends XYGlyph.Props {
    image: p.NumberSpec
    dw: p.DistanceSpec
    dh: p.DistanceSpec
    global_alpha: p.Property<number>
    dilate: p.Property<boolean>
    color_mapper: p.Property<ColorMapper>
  }

  export interface Visuals extends XYGlyph.Visuals {}
}

export interface Image extends Image.Attrs {}

export class Image extends XYGlyph {

  properties: Image.Props

  constructor(attrs?: Partial<Image.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Image'
    this.prototype.default_view = ImageView

    this.define({
      image:        [ p.NumberSpec       ], // TODO (bev) array spec?
      dw:           [ p.DistanceSpec     ],
      dh:           [ p.DistanceSpec     ],
      dilate:       [ p.Bool,      false ],
      global_alpha: [ p.Number,    1.0   ],
      color_mapper: [ p.Instance,  () => new LinearColorMapper({palette: Greys9()}) ],
    })
  }
}
Image.initClass()
