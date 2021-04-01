import {Marking, MarkingView} from "../graphics/marking"
import * as visuals from "core/visuals"
import {LineVector, FillVector} from "core/property_mixins"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export abstract class ArrowHeadView extends MarkingView implements visuals.Renderable {
  // This method should not begin or close a path
  abstract clip(ctx: Context2d, i: number): void
}

export namespace ArrowHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Marking.Props & {
    size: p.NumberSpec
  }

  export type Visuals = visuals.Visuals
}

export interface ArrowHead extends ArrowHead.Attrs {}

export abstract class ArrowHead extends Marking {
  override properties: ArrowHead.Props
  override __view_type__: ArrowHeadView

  constructor(attrs?: Partial<ArrowHead.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ArrowHead.Props>(() => ({
      size: [ p.NumberSpec, 25 ],
    }))
  }
}

export class OpenHeadView extends ArrowHeadView {
  override model: OpenHead
  override visuals: OpenHead.Visuals

  clip(ctx: Context2d, i: number): void {
    this.visuals.line.set_vectorize(ctx, i)
    const size_i = this.size.get(i)
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
      const size_i = this.size.get(i)
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
  override properties: OpenHead.Props
  override __view_type__: OpenHeadView

  constructor(attrs?: Partial<OpenHead.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = OpenHeadView

    this.mixins<OpenHead.Mixins>(LineVector)
  }
}

export class NormalHeadView extends ArrowHeadView {
  override model: NormalHead
  override visuals: NormalHead.Visuals

  clip(ctx: Context2d, i: number): void {
    this.visuals.line.set_vectorize(ctx, i)
    const size_i = this.size.get(i)
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
    const size_i = this.size.get(i)
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
  override properties: NormalHead.Props
  override __view_type__: NormalHeadView

  constructor(attrs?: Partial<NormalHead.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = NormalHeadView

    this.mixins<NormalHead.Mixins>([LineVector, FillVector])

    this.override<NormalHead.Props>({
      fill_color: "black",
    })
  }
}

export class VeeHeadView extends ArrowHeadView {
  override model: VeeHead
  override visuals: VeeHead.Visuals

  clip(ctx: Context2d, i: number): void {
    this.visuals.line.set_vectorize(ctx, i)
    const size_i = this.size.get(i)
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
    const size_i = this.size.get(i)
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
  override properties: VeeHead.Props
  override __view_type__: VeeHeadView

  constructor(attrs?: Partial<VeeHead.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = VeeHeadView

    this.mixins<VeeHead.Mixins>([LineVector, FillVector])

    this.override<VeeHead.Props>({
      fill_color: "black",
    })
  }
}

export class TeeHeadView extends ArrowHeadView {
  override model: TeeHead
  override visuals: TeeHead.Visuals

  render(ctx: Context2d, i: number): void {
    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, i)
      const size_i = this.size.get(i)
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
  override properties: TeeHead.Props
  override __view_type__: TeeHeadView

  constructor(attrs?: Partial<TeeHead.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TeeHeadView

    this.mixins<TeeHead.Mixins>(LineVector)
  }
}
