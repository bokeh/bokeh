import {EllipseOval, EllipseOvalView, EllipseOvalData} from "./ellipse_oval"
import {LineMixinVector, FillMixinVector} from "core/property_mixins"

export interface EllipseData extends EllipseOvalData {}

export interface EllipseView extends EllipseData {}

export class EllipseView extends EllipseOvalView {
  model: Ellipse
  visuals: Ellipse.Visuals
}

export namespace Ellipse {
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends EllipseOval.Attrs, Mixins {}

  export interface Props extends EllipseOval.Props {}

  export interface Visuals extends EllipseOval.Visuals {}
}

export interface Ellipse extends Ellipse.Attrs {}

export class Ellipse extends EllipseOval {

  properties: Ellipse.Props

  constructor(attrs?: Partial<Ellipse.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Ellipse'
    this.prototype.default_view = EllipseView
  }
}
Ellipse.initClass()
