import {Mapper} from "./mapper"
import {Factor} from "../ranges/factor_range"
import * as p from "core/properties"
import {Arrayable, Color} from "core/types"

import {color2hex} from "core/util/color"
import {is_little_endian} from "core/util/compat"

export interface RGBAMapper {
  v_compute(xs: Arrayable<number> | Arrayable<Factor>): Uint8Array
}

export function _convert_color(color: string): number {
  if (color[0] != "#")
    color = color2hex(color)
  if (color.length != 9)
    color = color + 'ff'
  return parseInt(color.slice(1), 16)
}

export function _convert_palette(palette: Color[]): Uint32Array {
  const new_palette = new Uint32Array(palette.length)
  for (let i = 0, end = palette.length; i < end; i++)
    new_palette[i] = _convert_color(palette[i])
  return new_palette
}

export function _uint32_to_rgba(values: Uint32Array): Uint8Array {
  if (is_little_endian) {
    const view = new DataView(values.buffer)
    for (let i = 0, end = values.length; i < end; i++)
      view.setUint32(i*4, values[i])
  }

  return new Uint8Array(values.buffer)
}

export namespace ColorMapper {
  export interface Attrs extends Mapper.Attrs {
    palette: Color[]
    nan_color: Color
  }

  export interface Props extends Mapper.Props {}
}

export interface ColorMapper extends ColorMapper.Attrs {}

export abstract class ColorMapper extends Mapper<Color> {

  properties: ColorMapper.Props

  constructor(attrs?: Partial<ColorMapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ColorMapper"

    this.define({
      palette:   [ p.Any           ], // TODO (bev)
      nan_color: [ p.Color, "gray" ],
    })
  }

  v_compute(xs: Arrayable<number> | Arrayable<Factor>): Arrayable<Color> {
    const values: Color[] = new Array(xs.length)
    this._v_compute(xs, values, this.palette, this._colors((c) => c))
    return values
  }

  get rgba_mapper(): RGBAMapper {
    const self = this
    const palette = _convert_palette(this.palette)
    const colors = this._colors(_convert_color)
    return {
      v_compute(xs: Arrayable<number> | Arrayable<Factor>): Uint8Array {
        const values = new Uint32Array(xs.length)
        self._v_compute(xs, values, palette, colors)
        return _uint32_to_rgba(values)
      },
    }
  }

  protected _colors<T>(conv: (c: Color) => T): {nan_color: T} {
    return {nan_color: conv(this.nan_color)}
  }

  protected abstract _v_compute<T>(xs: Arrayable<number> | Arrayable<Factor>, values: Arrayable<T>,
                                   palette: Arrayable<T>, colors: {nan_color: T}): void
}
ColorMapper.initClass()
