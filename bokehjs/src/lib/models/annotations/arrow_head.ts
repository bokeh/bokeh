import {Annotation} from "./annotation"
import {Visuals, Line, Fill} from "core/visuals"
import {LineVector, FillVector} from "core/property_mixins"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export namespace ArrowHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    size: p.Property<number>
  }
}

export interface ArrowHead extends ArrowHead.Attrs {}

export abstract class ArrowHead extends Annotation {
  properties: ArrowHead.Props

  constructor(attrs?: Partial<ArrowHead.Attrs>) {
    super(attrs)
  }

  static init_ArrowHead(): void {
    this.define<ArrowHead.Props>({
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

export namespace OpenHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & LineVector
}

export interface OpenHead extends OpenHead.Attrs {}

export class OpenHead extends ArrowHead {
  properties: OpenHead.Props

  constructor(attrs?: Partial<OpenHead.Attrs>) {
    super(attrs)
  }

  static init_OpenHead(): void {
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

export namespace NormalHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & LineVector & FillVector
}

export interface NormalHead extends NormalHead.Attrs {}

export class NormalHead extends ArrowHead {
  properties: NormalHead.Props

  constructor(attrs?: Partial<NormalHead.Attrs>) {
    super(attrs)
  }

  static init_NormalHead(): void {
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

export namespace VeeHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & LineVector & FillVector
}

export interface VeeHead extends VeeHead.Attrs {}

export class VeeHead extends ArrowHead {
  properties: VeeHead.Props

  constructor(attrs?: Partial<VeeHead.Attrs>) {
    super(attrs)
  }

  static init_VeeHead(): void {
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

export namespace TeeHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & LineVector
}

export interface TeeHead extends TeeHead.Attrs {}

export class TeeHead extends ArrowHead {
  properties: TeeHead.Props

  constructor(attrs?: Partial<TeeHead.Attrs>) {
    super(attrs)
  }

  static init_TeeHead(): void {
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
