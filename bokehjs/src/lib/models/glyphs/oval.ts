import {EllipseOval, EllipseOvalView, EllipseOvalData} from "./ellipse_oval"
import {LineVector, FillVector} from "core/property_mixins"
import * as p from "core/properties"

export interface OvalData extends EllipseOvalData {}

export interface OvalView extends OvalData {}

export class OvalView extends EllipseOvalView {
  model: Oval
  visuals: Oval.Visuals

  protected _map_data(): void {
    super._map_data()

    // oval drawn from bezier curves = ellipse with width reduced by 3/4
    const {sw} = this
    const n = sw.length
    for (let i = 0; i < n; i++) {
      sw[i] *= 0.75
    }
  }
}

export namespace Oval {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EllipseOval.Props & LineVector & FillVector

  export type Visuals = EllipseOval.Visuals
}

export interface Oval extends Oval.Attrs {}

export class Oval extends EllipseOval {
  properties: Oval.Props
  __view_type__: OvalView

  constructor(attrs?: Partial<Oval.Attrs>) {
    super(attrs)
  }

  static init_Oval(): void {
    this.prototype.default_view = OvalView
  }
}
