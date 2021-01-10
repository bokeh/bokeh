import {EllipseOval, EllipseOvalView, EllipseOvalData} from "./ellipse_oval"
import * as p from "core/properties"

export interface EllipseData extends EllipseOvalData {}

export interface EllipseView extends EllipseData {}

export class EllipseView extends EllipseOvalView {
  model: Ellipse
  visuals: Ellipse.Visuals
}

export namespace Ellipse {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EllipseOval.Props

  export type Visuals = EllipseOval.Visuals
}

export interface Ellipse extends Ellipse.Attrs {}

export class Ellipse extends EllipseOval {
  properties: Ellipse.Props
  __view_type__: EllipseView

  constructor(attrs?: Partial<Ellipse.Attrs>) {
    super(attrs)
  }

  static init_Ellipse(): void {
    this.prototype.default_view = EllipseView
  }
}
