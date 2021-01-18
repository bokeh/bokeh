import {Model} from "model"
import {View} from "core/view"
import * as visuals from "core/visuals"
import {LineVector, FillVector} from "core/property_mixins"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {RendererView} from "../renderers/renderer"

export abstract class ArrowHeadView extends View {
  model: ArrowHead
  visuals: ArrowHead.Visuals
  parent: RendererView

  _size: Float32Array

  initialize(): void {
    super.initialize()
    this.visuals = new visuals.Visuals(this)
  }

  abstract render(ctx: Context2d, i: number): void

  // This method should not begin or close a path
  abstract clip(ctx: Context2d, i: number): void
}

export namespace ArrowHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    size: p.NumberSpec
  }

  export type Visuals = {}
}

export interface ArrowHead extends ArrowHead.Attrs {}

export abstract class ArrowHead extends Model {
  properties: ArrowHead.Props
  __view_type__: ArrowHeadView

  constructor(attrs?: Partial<ArrowHead.Attrs>) {
    super(attrs)
  }

  static init_ArrowHead(): void {
    this.define<ArrowHead.Props>(() => ({
      size: [ p.NumberSpec, 25 ],
    }))
  }
}

export class OpenHeadView extends ArrowHeadView {
  model: OpenHead
  visuals: OpenHead.Visuals

  clip(ctx: Context2d, i: number): void {
    this.visuals.line.set_vectorize(ctx, i)
    const size_i = this._size[i]
    ctx.moveTo(0.5*size_i, size_i)
    ctx.lineTo(0.5*size_i, -2)
    ctx.lineTo(-0.5*size_i, -2)
    ctx.lineTo(-0.5*size_i, size_i)
    ctx.lineTo(0, 0)
    ctx.lineTo(0.5*size_i, size_i)
  }

  render(ctx: Context2d, i: number): void {
    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i)
      const size_i = this._size[i]
      ctx.beginPath()
      ctx.moveTo(0.5*size_i, size_i)
      ctx.lineTo(0, 0)
      ctx.lineTo(-0.5*size_i, size_i)
      ctx.stroke()
    }
  }
}

export namespace OpenHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & Mixins

  export type Mixins = LineVector

  export type Visuals = ArrowHead.Visuals & {line: visuals.LineVector}
}

export interface OpenHead extends OpenHead.Attrs {}

export class OpenHead extends ArrowHead {
  properties: OpenHead.Props
  __view_type__: OpenHeadView

  constructor(attrs?: Partial<OpenHead.Attrs>) {
    super(attrs)
  }

  static init_OpenHead(): void {
    this.prototype.default_view = OpenHeadView

    this.mixins<OpenHead.Mixins>(LineVector)
  }
}

export class NormalHeadView extends ArrowHeadView {
  model: NormalHead
  visuals: NormalHead.Visuals

  clip(ctx: Context2d, i: number): void {
    this.visuals.line.set_vectorize(ctx, i)
    const size_i = this._size[i]
    ctx.moveTo(0.5*size_i, size_i)
    ctx.lineTo(0.5*size_i, -2)
    ctx.lineTo(-0.5*size_i, -2)
    ctx.lineTo(-0.5*size_i, size_i)
    ctx.lineTo(0.5*size_i, size_i)
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

  protected _normal(ctx: Context2d, i: number): void {
    const size_i = this._size[i]
    ctx.beginPath()
    ctx.moveTo(0.5*size_i, size_i)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*size_i, size_i)
    ctx.closePath()
  }
}

export namespace NormalHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & Mixins

  export type Mixins = LineVector & FillVector

  export type Visuals = ArrowHead.Visuals & {line: visuals.LineVector, fill: visuals.FillVector}
}

export interface NormalHead extends NormalHead.Attrs {}

export class NormalHead extends ArrowHead {
  properties: NormalHead.Props
  __view_type__: NormalHeadView

  constructor(attrs?: Partial<NormalHead.Attrs>) {
    super(attrs)
  }

  static init_NormalHead(): void {
    this.prototype.default_view = NormalHeadView

    this.mixins<NormalHead.Mixins>([LineVector, FillVector])

    this.override<NormalHead.Props>({
      fill_color: "black",
    })
  }
}

export class VeeHeadView extends ArrowHeadView {
  model: VeeHead
  visuals: VeeHead.Visuals

  clip(ctx: Context2d, i: number): void {
    this.visuals.line.set_vectorize(ctx, i)
    const size_i = this._size[i]
    ctx.moveTo(0.5*size_i, size_i)
    ctx.lineTo(0.5*size_i, -2)
    ctx.lineTo(-0.5*size_i, -2)
    ctx.lineTo(-0.5*size_i, size_i)
    ctx.lineTo(0, 0.5*size_i)
    ctx.lineTo(0.5*size_i, size_i)
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

  protected _vee(ctx: Context2d, i: number): void {
    const size_i = this._size[i]
    ctx.beginPath()
    ctx.moveTo(0.5*size_i, size_i)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*size_i, size_i)
    ctx.lineTo(0, 0.5*size_i)
    ctx.closePath()
  }
}

export namespace VeeHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & Mixins

  export type Mixins = LineVector & FillVector

  export type Visuals = ArrowHead.Visuals & {line: visuals.LineVector, fill: visuals.FillVector}
}

export interface VeeHead extends VeeHead.Attrs {}

export class VeeHead extends ArrowHead {
  properties: VeeHead.Props
  __view_type__: VeeHeadView

  constructor(attrs?: Partial<VeeHead.Attrs>) {
    super(attrs)
  }

  static init_VeeHead(): void {
    this.prototype.default_view = VeeHeadView

    this.mixins<VeeHead.Mixins>([LineVector, FillVector])

    this.override<VeeHead.Props>({
      fill_color: "black",
    })
  }
}

export class TeeHeadView extends ArrowHeadView {
  model: TeeHead
  visuals: TeeHead.Visuals

  render(ctx: Context2d, i: number): void {
    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i)
      const size_i = this._size[i]
      ctx.beginPath()
      ctx.moveTo(0.5*size_i, 0)
      ctx.lineTo(-0.5*size_i, 0)
      ctx.stroke()
    }
  }

  clip(_ctx: Context2d, _i: number): void {}
}

export namespace TeeHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & Mixins

  export type Mixins = LineVector

  export type Visuals = ArrowHead.Visuals & {line: visuals.LineVector}
}

export interface TeeHead extends TeeHead.Attrs {}

export class TeeHead extends ArrowHead {
  properties: TeeHead.Props
  __view_type__: TeeHeadView

  constructor(attrs?: Partial<TeeHead.Attrs>) {
    super(attrs)
  }

  static init_TeeHead(): void {
    this.prototype.default_view = TeeHeadView

    this.mixins<TeeHead.Mixins>(LineVector)
  }
}
