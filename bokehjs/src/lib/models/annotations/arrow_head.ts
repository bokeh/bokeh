import {Marking, MarkingView} from "../graphics/marking"
import type * as visuals from "core/visuals"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import type {MarkingGeometry} from "../graphics/marking"

export abstract class ArrowHeadView extends MarkingView implements visuals.Paintable {
  override line_extent(i: number): number {
    return this.size.get(i)
  }
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

  static {
    this.define<ArrowHead.Props>(() => ({
      size: [ p.NumberSpec, 25 ],
    }))
  }
}

export class OpenHeadView extends ArrowHeadView {
  override line_extent(_i: number): number {
    return 0
  }

  declare model: OpenHead
  declare visuals: OpenHead.Visuals

  override hit_geometry(i: number): MarkingGeometry {
    const size_i = this.size.get(i)
    return {
      type: "polyline",
      x: [0.5*size_i, 0, -0.5*size_i],
      y: [size_i, 0, size_i],
    }
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

  static {
    this.prototype.default_view = OpenHeadView

    this.mixins<OpenHead.Mixins>(LineVector)
  }
}

export class NormalHeadView extends ArrowHeadView {
  declare model: NormalHead
  declare visuals: NormalHead.Visuals

  override hit_geometry(i: number): MarkingGeometry {
    const size_i = this.size.get(i)
    return {
      type: "polygon",
      x: [0.5*size_i, 0, -0.5*size_i],
      y: [size_i, 0, size_i],
    }
  }

  paint(ctx: Context2d, i: number): void {
    const size_i = this.size.get(i)
    ctx.beginPath()
    ctx.moveTo(0.5*size_i, size_i)
    ctx.lineTo(0, 0)
    ctx.lineTo(-0.5*size_i, size_i)
    ctx.closePath()

    this.visuals.fill.apply(ctx, i)
    this.visuals.hatch.apply(ctx, i)
    this.visuals.line.apply(ctx, i)
  }
}

export namespace NormalHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = ArrowHead.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface NormalHead extends NormalHead.Attrs {}

export class NormalHead extends ArrowHead {
  declare properties: NormalHead.Props
  declare __view_type__: NormalHeadView

  static {
    this.prototype.default_view = NormalHeadView

    this.mixins<NormalHead.Mixins>([LineVector, FillVector, HatchVector])

    this.override<NormalHead.Props>({
      fill_color: "black",
    })
  }
}

export class VeeHeadView extends ArrowHeadView {
  override line_extent(i: number): number {
    return 0.5*this.size.get(i)
  }

  declare model: VeeHead
  declare visuals: VeeHead.Visuals

  override hit_geometry(i: number): MarkingGeometry {
    const size_i = this.size.get(i)
    return {
      type: "polygon",
      x: [0.5*size_i, 0, -0.5*size_i, 0],
      y: [size_i, 0, size_i, 0.5*size_i],
    }
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
    this.visuals.hatch.apply(ctx, i)
    this.visuals.line.apply(ctx, i)
  }
}

export namespace VeeHead {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ArrowHead.Props & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = ArrowHead.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface VeeHead extends VeeHead.Attrs {}

export class VeeHead extends ArrowHead {
  declare properties: VeeHead.Props
  declare __view_type__: VeeHeadView

  static {
    this.prototype.default_view = VeeHeadView

    this.mixins<VeeHead.Mixins>([LineVector, FillVector, HatchVector])

    this.override<VeeHead.Props>({
      fill_color: "black",
    })
  }
}

export class TeeHeadView extends ArrowHeadView {
  declare model: TeeHead
  declare visuals: TeeHead.Visuals

  override line_extent(_i: number): number {
    return 0
  }

  override hit_geometry(i: number): MarkingGeometry {
    const size_i = this.size.get(i)
    return {
      type: "polyline",
      x: [0.5*size_i, -0.5*size_i],
      y: [0, 0],
    }
  }

  paint(ctx: Context2d, i: number): void {
    const size_i = this.size.get(i)
    ctx.beginPath()
    ctx.moveTo(0.5*size_i, 0)
    ctx.lineTo(-0.5*size_i, 0)
    this.visuals.line.apply(ctx, i)
  }
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

  static {
    this.prototype.default_view = TeeHeadView

    this.mixins<TeeHead.Mixins>(LineVector)
  }
}
