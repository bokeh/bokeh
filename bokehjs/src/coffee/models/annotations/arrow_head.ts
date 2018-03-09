import {Annotation} from "./annotation"
import {Visuals, Line, Fill} from "core/visuals"
import {LineMixinVector, FillMixinVector} from "core/property_mixins"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export namespace ArrowHead {
  export interface Attrs extends Annotation.Attrs {
    size: number
  }

  export interface Props extends Annotation.Props {
    size: p.Property<number>
  }
}

export interface ArrowHead extends ArrowHead.Attrs {}

export abstract class ArrowHead extends Annotation {

  constructor(attrs?: Partial<ArrowHead.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'ArrowHead'

    this.define({
      size: [ p.Number, 25 ],
    })
  }

  visuals: Visuals

  initialize(): void {
    super.initialize()
    this.visuals = new Visuals(this)
  }

  abstract render(ctx: Context2d, i: number): void

  abstract clip(ctx: Context2d, i: number): void // This method should not begin or close a path
}
ArrowHead.initClass()

export namespace OpenHead {
  export interface Mixins extends LineMixinVector {}

  export interface Attrs extends ArrowHead.Attrs, Mixins {}

  export interface Props extends ArrowHead.Props {}
}

export interface OpenHead extends OpenHead.Attrs {}

export class OpenHead extends ArrowHead {

  properties: OpenHead.Props

  constructor(attrs?: Partial<OpenHead.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'OpenHead'

    this.mixins(['line'])
  }

  visuals: Visuals & {line: Line}

  clip(ctx: Context2d, i: number): void {
    // This method should not begin or close a path
    this.visuals.line.set_vectorize(ctx, i)
    ctx.moveTo(0.5*this.size, this.size)
    ctx.lineTo(0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, this.size)
    ctx.lineTo(0, 0)
    ctx.lineTo(0.5*this.size, this.size)
  }

  render(ctx: Context2d, i: number): void {
    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i)

      ctx.beginPath()
      ctx.moveTo(0.5*this.size, this.size)
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*this.size, this.size)
      ctx.stroke()
    }
  }
}
OpenHead.initClass()

export namespace NormalHead {
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends ArrowHead.Attrs, Mixins {}

  export interface Props extends ArrowHead.Props {}
}

export interface NormalHead extends NormalHead.Attrs {}

export class NormalHead extends ArrowHead {

  properties: NormalHead.Props

  constructor(attrs?: Partial<NormalHead.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'NormalHead'

    this.mixins(['line', 'fill'])

    this.override({
      fill_color: 'black',
    })
  }

  visuals: Visuals & {line: Line, fill: Fill}

  clip(ctx: Context2d, i: number): void {
    // This method should not begin or close a path
    this.visuals.line.set_vectorize(ctx, i)
    ctx.moveTo(0.5*this.size, this.size)
    ctx.lineTo(0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, this.size)
    ctx.lineTo(0.5*this.size, this.size)
  }

  render(ctx: Context2d, i: number): void {
    if (this.visuals.fill.doit) {
      this.visuals.fill.set_vectorize(ctx, i)
      this._normal(ctx, i)
      ctx.fill()
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i)
      this._normal(ctx, i)
      ctx.stroke()
    }
  }

  _normal(ctx: Context2d, _i: number): void {
    ctx.beginPath()
    ctx.moveTo(0.5*this.size, this.size)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*this.size, this.size)
    ctx.closePath()
  }
}
NormalHead.initClass()

export namespace VeeHead {
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends ArrowHead.Attrs, Mixins {}

  export interface Props extends ArrowHead.Props {}
}

export interface VeeHead extends VeeHead.Attrs {}

export class VeeHead extends ArrowHead {

  properties: VeeHead.Props

  constructor(attrs?: Partial<VeeHead.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'VeeHead'

    this.mixins(['line', 'fill'])

    this.override({
      fill_color: 'black',
    })
  }

  visuals: Visuals & {line: Line, fill: Fill}

  clip(ctx: Context2d, i: number): void {
    // This method should not begin or close a path
    this.visuals.line.set_vectorize(ctx, i)
    ctx.moveTo(0.5*this.size, this.size)
    ctx.lineTo(0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, -2)
    ctx.lineTo(-0.5*this.size, this.size)
    ctx.lineTo(0, 0.5*this.size)
    ctx.lineTo(0.5*this.size, this.size)
  }

  render(ctx: Context2d, i: number): void {
    if (this.visuals.fill.doit) {
      this.visuals.fill.set_vectorize(ctx, i)
      this._vee(ctx, i)
      ctx.fill()
    }

    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i)
      this._vee(ctx, i)
      ctx.stroke()
    }
  }

  _vee(ctx: Context2d, _i: number): void {
    ctx.beginPath()
    ctx.moveTo(0.5*this.size, this.size)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*this.size, this.size)
    ctx.lineTo(0, 0.5*this.size)
    ctx.closePath()
  }
}
VeeHead.initClass()

export namespace TeeHead {
  export interface Mixins extends LineMixinVector {}

  export interface Attrs extends ArrowHead.Attrs, Mixins {}

  export interface Props extends ArrowHead.Props {}
}

export interface TeeHead extends TeeHead.Attrs {}

export class TeeHead extends ArrowHead {

  properties: TeeHead.Props

  constructor(attrs?: Partial<TeeHead.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'TeeHead'

    this.mixins(['line'])
  }

  visuals: Visuals & {line: Line}

  render(ctx: Context2d, i: number): void {
    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i)
      ctx.beginPath()
      ctx.moveTo(0.5*this.size, 0)
      ctx.lineTo(-0.5*this.size, 0)
      ctx.stroke()
    }
  }

  clip(_ctx: Context2d, _i: number): void {}
}
TeeHead.initClass()
