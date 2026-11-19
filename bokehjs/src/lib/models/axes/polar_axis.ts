import {GuideRenderer, GuideRendererView} from "../renderers/guide_renderer"
import {PolarCoordinateTransform} from "../coordinates/polar_mapping"
import {Ticker} from "../tickers/ticker"
import {BasicTicker} from "../tickers/basic_ticker"
import {TickFormatter} from "../formatters/tick_formatter"
import {BasicTickFormatter} from "../formatters/basic_tick_formatter"
import * as mixins from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {GraphicsBox} from "core/graphics"
import type {Context2d} from "core/util/canvas"

export function polar_ticks(axis: PolarAxis, transform: PolarCoordinateTransform): number[] {
  const range = axis.dimension == "radial" ? transform.mapping.radial_range : transform.mapping.angular_range
  const ticks = axis.ticker.get_ticks(range.start, range.end, range, 0).major as number[]
  return ticks.filter((tick) => range.start <= tick && tick <= range.end &&
    !(axis.dimension == "angular" && transform.full_circle && tick == range.end))
}

export class PolarAxisView extends GuideRendererView {
  declare model: PolarAxis
  declare visuals: PolarAxis.Visuals

  override get needs_clip(): boolean {
    return true
  }

  override get uses_plot_coordinate_system(): boolean {
    return true
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.request_paint())
  }

  compute_labels(ticks: number[]): GraphicsBox[] {
    const transform = this.coordinates
    const values = this.model.dimension == "angular" && this.model.wrap_labels && transform instanceof PolarCoordinateTransform
      ? ticks.map((tick) => transform.normalize(tick, 0)) : ticks
    return this.model.formatter.format_graphics(values, {loc: 0, ticker: this.model.ticker})
  }

  protected _paint(ctx: Context2d): void {
    const transform = this.coordinates
    if (!(transform instanceof PolarCoordinateTransform)) {
      return
    }
    if (!transform.validate()) {
      return
    }
    const {radial_range, angular_range} = transform.mapping
    const ticks = polar_ticks(this.model, transform)
    const labels = this.compute_labels(ticks)
    const radial = this.model.dimension == "radial"
    const theta = angular_range.start
    const phi = transform.angle(theta)

    ctx.beginPath()
    if (radial) {
      ctx.moveTo(...transform.center)
      ctx.lineTo(...transform.position(transform.radius, theta))
    } else {
      transform.trace(ctx)
    }
    this.visuals.axis_line.apply(ctx)

    for (let i = 0; i < ticks.length; i++) {
      const tick = ticks[i]
      const rho = radial ? transform.x_scale.compute(tick)*transform.radius : transform.radius
      const angle = radial ? theta : tick
      const [sx, sy] = transform.position(rho, angle)
      const p = radial ? phi + Math.PI/2 : transform.angle(angle)
      const dx = Math.cos(p)
      const dy = Math.sin(p)
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + 5*dx, sy + 5*dy)
      this.visuals.axis_line.apply(ctx)
      if (!(radial && tick == radial_range.start) && this.visuals.major_label_text.doit) {
        const label = labels[i]
        label.base_font_size = this.plot_view.base_font_size
        label.visuals = this.visuals.major_label_text.values()
        label.position = {sx: sx + (radial ? 14 : 20)*dx, sy: sy + (radial ? 14 : 20)*dy}
        label.paint(ctx)
      }
    }
  }
}

export namespace PolarAxis {
  export type Attrs = p.AttrsOf<Props>
  export type Props = GuideRenderer.Props & {
    dimension: p.Property<"radial" | "angular">
    wrap_labels: p.Property<boolean>
    ticker: p.Property<Ticker>
    formatter: p.Property<TickFormatter>
  } & Mixins
  export type Mixins = mixins.AxisLine & mixins.MajorLabelText
  export type Visuals = GuideRenderer.Visuals & {axis_line: visuals.Line, major_label_text: visuals.Text}
}

export interface PolarAxis extends PolarAxis.Attrs {}

export class PolarAxis extends GuideRenderer {
  declare properties: PolarAxis.Props
  declare __view_type__: PolarAxisView

  override connect_signals(): void {
    super.connect_signals()
    this.on_transitive_change(this.properties.ticker, () => this.change.emit())
    this.on_transitive_change(this.properties.formatter, () => this.change.emit())
  }

  static {
    this.prototype.default_view = PolarAxisView
    this.mixins<PolarAxis.Mixins>([["axis_", mixins.Line], ["major_label_", mixins.Text]])
    this.define<PolarAxis.Props>(({Enum, Ref, Bool}) => ({
      wrap_labels: [Bool, true],
      dimension: [Enum("radial", "angular"), "radial"],
      ticker: [Ref(Ticker), () => BasicTicker.create()],
      formatter: [Ref(TickFormatter), () => BasicTickFormatter.create()],
    }))
    this.override<PolarAxis.Props>({
      major_label_text_font_size: "10px",
      major_label_text_align: "center",
      major_label_text_baseline: "middle",
    })
  }
}
