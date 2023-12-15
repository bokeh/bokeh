import {Shape, ShapeView} from "./shape"
import type * as visuals from "core/visuals"
import {Line, Fill, Hatch} from "core/property_mixins"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"

export abstract class ArrowHeadView extends ShapeView {
  // This method should not begin or close a path
  abstract clip(ctx: Context2d): void
}

export namespace ArrowHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    size: p.Property<number>
  }

  export type Visuals = visuals.Visuals
}

export interface ArrowHead extends ArrowHead.Attrs {}

export abstract class ArrowHead extends Shape {
  declare properties: ArrowHead.Props
  declare __view_type__: ArrowHeadView

  constructor(attrs?: Partial<ArrowHead.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ArrowHead.Props>(({Number, NonNegative}) => ({
      size: [ NonNegative(Number), 25 ],
    }))
  }
}

export class OpenHeadView extends ArrowHeadView {
  declare model: OpenHead
  declare visuals: OpenHead.Visuals

  clip(ctx: Context2d): void {
    this.visuals.line.set_value(ctx)
    const {size} = this.model
    ctx.moveTo(0.5*size, size)
    ctx.lineTo(0.5*size, -2)
    ctx.lineTo(-0.5*size, -2)
    ctx.lineTo(-0.5*size, size)
    ctx.lineTo(0, 0)
    ctx.lineTo(0.5*size, size)
  }

  paint(ctx: Context2d): void {
    const {size} = this.model
    ctx.beginPath()
    ctx.moveTo(0.5*size, size)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*size, size)
    this.visuals.line.apply(ctx)
  }
}

export namespace OpenHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & Mixins

  export type Mixins = Line

  export type Visuals = ArrowHead.Visuals & {line: visuals.Line}
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

    this.mixins<OpenHead.Mixins>(Line)
  }
}

export class NormalHeadView extends ArrowHeadView {
  declare model: NormalHead
  declare visuals: NormalHead.Visuals

  clip(ctx: Context2d): void {
    this.visuals.line.set_value(ctx)
    const {size} = this.model
    ctx.moveTo(0.5*size, size)
    ctx.lineTo(0.5*size, -2)
    ctx.lineTo(-0.5*size, -2)
    ctx.lineTo(-0.5*size, size)
    ctx.lineTo(0.5*size, size)
  }

  paint(ctx: Context2d): void {
    const {size} = this.model
    ctx.beginPath()
    ctx.moveTo(0.5*size, size)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*size, size)
    ctx.closePath()

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }
}

export namespace NormalHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & Mixins

  export type Mixins = Line & Fill & Hatch

  export type Visuals = ArrowHead.Visuals & {line: visuals.Line, fill: visuals.Fill, hatch: visuals.Hatch}
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

    this.mixins<NormalHead.Mixins>([Line, Fill, Hatch])

    this.override<NormalHead.Props>({
      fill_color: "black",
    })
  }
}

export class VeeHeadView extends ArrowHeadView {
  declare model: VeeHead
  declare visuals: VeeHead.Visuals

  clip(ctx: Context2d): void {
    this.visuals.line.set_value(ctx)
    const {size} = this.model
    ctx.moveTo(0.5*size, size)
    ctx.lineTo(0.5*size, -2)
    ctx.lineTo(-0.5*size, -2)
    ctx.lineTo(-0.5*size, size)
    ctx.lineTo(0, 0.5*size)
    ctx.lineTo(0.5*size, size)
  }

  paint(ctx: Context2d): void {
    const {size} = this.model
    ctx.beginPath()
    ctx.moveTo(0.5*size, size)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*size, size)
    ctx.lineTo(0, 0.5*size)
    ctx.closePath()

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }
}

export namespace VeeHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & Mixins

  export type Mixins = Line & Fill & Hatch

  export type Visuals = ArrowHead.Visuals & {line: visuals.Line, fill: visuals.Fill, hatch: visuals.Hatch}
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

    this.mixins<VeeHead.Mixins>([Line, Fill, Hatch])

    this.override<VeeHead.Props>({
      fill_color: "black",
    })
  }
}

export class TeeHeadView extends ArrowHeadView {
  declare model: TeeHead
  declare visuals: TeeHead.Visuals

  paint(ctx: Context2d): void {
    const {size} = this.model
    ctx.beginPath()
    ctx.moveTo(0.5*size, 0)
    ctx.lineTo(-0.5*size, 0)
    this.visuals.line.apply(ctx)
  }

  clip(_ctx: Context2d): void {}
}

export namespace TeeHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & Mixins

  export type Mixins = Line

  export type Visuals = ArrowHead.Visuals & {line: visuals.Line}
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

    this.mixins<TeeHead.Mixins>(Line)
  }
}
