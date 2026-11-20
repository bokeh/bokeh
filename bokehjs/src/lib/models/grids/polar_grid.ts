import {GuideRenderer, GuideRendererView} from "../renderers/guide_renderer"
import {trace_polar_arc} from "../renderers/polar"
import {PolarAxis, polar_ticks} from "../axes/polar_axis"
import {PolarCoordinateTransform} from "../coordinates/polar_mapping"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"

export class PolarGridView extends GuideRendererView {
  declare model: PolarGrid
  declare visuals: PolarGrid.Visuals

  override get needs_clip(): boolean {
    return true
  }

  override get uses_plot_coordinate_system(): boolean {
    return true
  }

  protected override get requires_polar_coordinates(): boolean {
    return true
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_paint())
    this.on_transitive_change(this.model.properties.axis, () => this.request_paint())
  }

  protected _paint(ctx: Context2d): void {
    const transform = this.coordinates
    if (!(transform instanceof PolarCoordinateTransform)) {
      return
    }
    if (!transform.validate()) {
      return
    }
    ctx.beginPath()
    for (const tick of polar_ticks(this.model.axis, transform)) {
      switch (this.model.axis.dimension) {
        case "radial": {
          const radius = transform.x_scale.compute(tick)*transform.radius
          ctx.moveTo(...transform.position(radius, transform.mapping.angular_range.start))
          trace_polar_arc(ctx, transform, radius)
          break
        }
        case "angular": {
          ctx.moveTo(...transform.center)
          ctx.lineTo(...transform.position(transform.radius, tick))
          break
        }
      }
    }
    this.visuals.grid_line.apply(ctx)
  }
}

export namespace PolarGrid {
  export type Attrs = p.AttrsOf<Props>
  export type Props = GuideRenderer.Props & {axis: p.Property<PolarAxis>} & Mixins
  export type Mixins = mixins.GridLine
  export type Visuals = GuideRenderer.Visuals & {grid_line: visuals.Line}
}

export interface PolarGrid extends PolarGrid.Attrs {}

export class PolarGrid extends GuideRenderer {
  declare properties: PolarGrid.Props
  declare __view_type__: PolarGridView

  static {
    this.prototype.default_view = PolarGridView
    this.mixins<PolarGrid.Mixins>([["grid_", mixins.Line]])
    this.define<PolarGrid.Props>(({Ref}) => ({axis: [Ref(PolarAxis)]}))
    this.override<PolarGrid.Props>({grid_line_color: "#e5e5e5", level: "underlay"})
  }
}
