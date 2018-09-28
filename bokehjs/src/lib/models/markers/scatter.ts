import {Marker, MarkerView, MarkerData} from "./marker"
import {marker_funcs} from "./defs"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {IBBox} from "core/util/bbox"

export interface ScatterData extends MarkerData {
  _marker: Arrayable<string>
}

export interface ScatterView extends ScatterData {}

export class ScatterView extends MarkerView {
  model: Scatter

  protected _render(ctx: Context2d, indices: number[], {sx, sy, _size, _angle, _marker}: ScatterData): void {
    for (const i of indices) {
      if (isNaN(sx[i] + sy[i] + _size[i] + _angle[i]))
        continue

      const r = _size[i]/2

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      if (_angle[i])
        ctx.rotate(_angle[i])

      marker_funcs[_marker[i]](ctx, i, r, this.visuals.line, this.visuals.fill)

      if (_angle[i])
        ctx.rotate(-_angle[i])

      ctx.translate(-sx[i], -sy[i])
    }
  }

  draw_legend_for_index(ctx: Context2d, {x0, x1, y0, y1}: IBBox, index: number): void {
    // using objects like this seems a little wonky, since the keys are coerced to
    // stings, but it works
    const len = index + 1

    const sx: number[] = new Array(len)
    sx[index] = (x0 + x1)/2
    const sy: number[] = new Array(len)
    sy[index] = (y0 + y1)/2

    const size: number[] = new Array(len)
    size[index] = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0))*0.4
    const angle: number[] = new Array(len)
    angle[index] = 0 // don't attempt to match glyph angle

    const marker: string[] = new Array(len)
    marker[index] = this._marker[index]

    this._render(ctx, [index], {sx, sy, _size: size, _angle: angle, _marker: marker} as any) // XXX
  }
}

export namespace Scatter {
  export interface Attrs extends Marker.Attrs{
    marker: string
  }

  export interface Props extends Marker.Props {}
}

export interface Scatter extends Scatter.Attrs {}

export abstract class Scatter extends Marker {

  properties: Scatter.Props

  constructor(attrs?: Partial<Scatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Scatter'
    this.prototype.default_view = ScatterView
    this.define({
      marker: [ p.MarkerSpec , {value: "circle"} ],
    })
  }
}
Scatter.initClass()
