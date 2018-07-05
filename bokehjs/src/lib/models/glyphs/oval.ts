import {EllipseOval, EllipseOvalView, EllipseOvalData} from "./ellipse_oval"
import {LineMixinVector, FillMixinVector} from "core/property_mixins"
import {Arrayable} from "core/types"

export interface OvalData extends EllipseOvalData {}

export interface OvalView extends OvalData {}

export class OvalView extends EllipseOvalView {
  model: Oval
  visuals: Oval.Visuals

  protected _map_data(): void {
    let sw: Arrayable<number>
    const n = this._x.length
    this.sw = new Float64Array(n)

    if (this.model.properties.width.units == "data")
      sw = this.sdist(this.renderer.xscale, this._x, this._width, 'center')
    else
      sw = this._width

    // oval drawn from bezier curves = ellipse with width reduced by 3/4
    for (let i = 0; i < n; i++)
      this.sw[i] = sw[i] * 0.75

    if (this.model.properties.height.units == "data")
      this.sh = this.sdist(this.renderer.yscale, this._y, this._height, 'center')
    else
      this.sh = this._height
  }
}

export namespace Oval {
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends EllipseOval.Attrs, Mixins {}

  export interface Props extends EllipseOval.Props {}

  export interface Visuals extends EllipseOval.Visuals {}
}

export interface Oval extends Oval.Attrs {}

export class Oval extends EllipseOval {

  properties: Oval.Props

  constructor(attrs?: Partial<Oval.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Oval'
    this.prototype.default_view = OvalView
  }
}
Oval.initClass()
