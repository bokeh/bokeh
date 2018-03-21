import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {DistanceSpec, NumberSpec} from "core/vectorization"
import {Arrayable, TypedArray} from "core/types"
import * as p from "core/properties"
import {max, concat} from "core/util/array"
import {Context2d} from "core/util/canvas"
import {Rect} from "core/util/spatial"

export interface ImageRGBAData extends XYGlyphData {
  image_data: Arrayable<HTMLCanvasElement>

  _image: Arrayable<TypedArray | number[][]>
  _dw: Arrayable<number>
  _dh: Arrayable<number>

  _image_shape?: Arrayable<[number, number]>

  sw: Arrayable<number>
  sh: Arrayable<number>

  max_dw: number
  max_dh: number
}

export interface ImageRGBAView extends ImageRGBAData {}

export class ImageRGBAView extends XYGlyphView {
  model: ImageRGBA
  visuals: ImageRGBA.Visuals

  protected _width: Arrayable<number>
  protected _height: Arrayable<number>

  initialize(options: any): void {
    super.initialize(options)
    this.connect(this.model.properties.global_alpha.change, () => this.renderer.request_render())
  }

  protected _set_data(indices: number[] | null): void {
    if (this.image_data == null || this.image_data.length != this._image.length)
      this.image_data = new Array(this._image.length)

    if (this._width == null || this._width.length != this._image.length)
      this._width = new Array(this._image.length)

    if (this._height == null || this._height.length != this._image.length)
      this._height = new Array(this._image.length)

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
      const buf8 = new Uint8Array(buf)
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
        this.sw = this.sdist(this.renderer.xscale, this._x, this._dw, "edge", this.model.dilate)
        break
      }
      case "screen": {
        this.sw = this._dw
        break
      }
    }

    switch (this.model.properties.dh.units) {
      case "data": {
        this.sh = this.sdist(this.renderer.yscale, this._y, this._dh, "edge", this.model.dilate)
        break
      }
      case "screen": {
        this.sh = this._dh
        break
      }
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

  bounds(): Rect {
    const {bbox} = this.index
    bbox.maxX += this.max_dw
    bbox.maxY += this.max_dh
    return bbox
  }
}

export namespace ImageRGBA {
  export interface Attrs extends XYGlyph.Attrs {
    image: NumberSpec
    dw: DistanceSpec
    dh: DistanceSpec
    global_alpha: number
    dilate: boolean
  }

  export interface Props extends XYGlyph.Props {
    image: p.NumberSpec
    dw: p.DistanceSpec
    dh: p.DistanceSpec
    global_alpha: p.Property<number>
    dilate: p.Property<boolean>
  }

  export interface Visuals extends XYGlyph.Visuals {}
}

export interface ImageRGBA extends ImageRGBA.Attrs {}

export class ImageRGBA extends XYGlyph {

  properties: ImageRGBA.Props

  constructor(attrs?: Partial<ImageRGBA.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'ImageRGBA'
    this.prototype.default_view = ImageRGBAView

    this.define({
      image:        [ p.NumberSpec         ], // TODO (bev) array spec?
      dw:           [ p.DistanceSpec       ],
      dh:           [ p.DistanceSpec       ],
      global_alpha: [ p.Number,      1.0   ],
      dilate:       [ p.Bool,        false ],
    })
  }
}
ImageRGBA.initClass()
