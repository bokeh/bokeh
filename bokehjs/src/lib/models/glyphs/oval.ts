import {EllipseOval, EllipseOvalView, EllipseOvalData} from "./ellipse_oval"
import {mul} from "core/util/arrayable"
import * as p from "core/properties"

export type OvalData = EllipseOvalData

export interface OvalView extends OvalData {}

export class OvalView extends EllipseOvalView {
  override model: Oval
  override visuals: Oval.Visuals

  protected override _map_data(): void {
    super._map_data()
    mul(this.sw, 0.75) // oval drawn from bezier curves = ellipse with width reduced by 3/4
  }
}

export namespace Oval {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EllipseOval.Props

  export type Visuals = EllipseOval.Visuals
}

export interface Oval extends Oval.Attrs {}

export class Oval extends EllipseOval {
  override properties: Oval.Props
  override __view_type__: OvalView

  constructor(attrs?: Partial<Oval.Attrs>) {
    super(attrs)
  }

  static init_Oval(): void {
    this.prototype.default_view = OvalView
  }
}
