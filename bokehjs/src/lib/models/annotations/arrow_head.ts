import {Marking, MarkingView} from "../graphics/marking"
import type * as visuals from "core/visuals"
import {LineVector, FillVector} from "core/property_mixins"
import * as p from "core/properties"
import type {Context2d} from "core/util/canvas"

export abstract class ArrowHeadView extends MarkingView implements visuals.Paintable {
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
  declare properties: ArrowHead.Props
  declare __view_type__: ArrowHeadView

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
  declare model: OpenHead
  declare visuals: OpenHead.Visuals

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

  paint(ctx: Context2d, i: number): void {
    const size_i = this.size.get(i)
    ctx.beginPath()
    ctx.moveTo(0.5*size_i, size_i)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*size_i, size_i)
    this.visuals.line.apply(ctx, i)
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
  declare properties: OpenHead.Props
  declare __view_type__: OpenHeadView

  constructor(attrs?: Partial<OpenHead.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = OpenHeadView

    this.mixins<OpenHead.Mixins>(LineVector)
  }
}

export class NormalHeadView extends ArrowHeadView {
  declare model: NormalHead
  declare visuals: NormalHead.Visuals

  clip(ctx: Context2d, i: number): void {
    this.visuals.line.set_vectorize(ctx, i)
    const size_i = this.size.get(i)
    ctx.moveTo(0.5*size_i, size_i)
    ctx.lineTo(0.5*size_i, -2)
    ctx.lineTo(-0.5*size_i, -2)
    ctx.lineTo(-0.5*size_i, size_i)
    ctx.lineTo(0.5*size_i, size_i)
  }

  paint(ctx: Context2d, i: number): void {
    const size_i = this.size.get(i)
    ctx.beginPath()
    ctx.moveTo(0.5*size_i, size_i)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*size_i, size_i)
    ctx.closePath()

    this.visuals.fill.apply(ctx, i)
    this.visuals.line.apply(ctx, i)
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
  declare properties: NormalHead.Props
  declare __view_type__: NormalHeadView

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
  declare model: VeeHead
  declare visuals: VeeHead.Visuals

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

  paint(ctx: Context2d, i: number): void {
    const size_i = this.size.get(i)
    ctx.beginPath()
    ctx.moveTo(0.5*size_i, size_i)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*size_i, size_i)
    ctx.lineTo(0, 0.5*size_i)
    ctx.closePath()

    this.visuals.fill.apply(ctx, i)
    this.visuals.line.apply(ctx, i)
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
  declare properties: VeeHead.Props
  declare __view_type__: VeeHeadView

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
  declare model: TeeHead
  declare visuals: TeeHead.Visuals

  paint(ctx: Context2d, i: number): void {
    const size_i = this.size.get(i)
    ctx.beginPath()
    ctx.moveTo(0.5*size_i, 0)
    ctx.lineTo(-0.5*size_i, 0)
    this.visuals.line.apply(ctx, i)
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
  declare properties: TeeHead.Props
  declare __view_type__: TeeHeadView

  constructor(attrs?: Partial<TeeHead.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TeeHeadView

    this.mixins<TeeHead.Mixins>(LineVector)
  }
}
