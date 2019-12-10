import {Arrayable} from "@bokehjs/core/types"
import {Document} from "@bokehjs/document"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot} from "@bokehjs/models/plots/plot"
import {Glyph, GlyphView} from "@bokehjs/models/glyphs/glyph"
import {GlyphRenderer, GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Scale} from "@bokehjs/models/scales/scale"
import {LinearScale} from "@bokehjs/models/scales/linear_scale"
import {LogScale} from "@bokehjs/models/scales/log_scale"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {build_view} from "@bokehjs/core/build_views"

export async function create_glyph_renderer_view(glyph: Glyph, data: {[key: string]: Arrayable} = {}): Promise<GlyphRendererView> {
  const doc = new Document()
  const plot = new Plot({
    x_range: new Range1d({start: 0, end: 1}),
    y_range: new Range1d({start: 0, end: 1}),
  })
  const plot_view = (await build_view(plot)).build()
  doc.add_root(plot)

  const data_source = new ColumnDataSource({data})

  const glyph_renderer = new GlyphRenderer({glyph, data_source})
  const glyph_renderer_view = await build_view(glyph_renderer, {parent: plot_view})

  return glyph_renderer_view
}

import {HasProps} from "@bokehjs/core/has_props"
export type ViewType<T extends HasProps> = InstanceType<T["default_view"]>

export async function create_glyph_view<G extends Glyph>(glyph: G, data: {[key: string]: Arrayable} = {}): Promise<ViewType<G>> {
  return (await create_glyph_renderer_view(glyph, data)).glyph /* glyph_view */ as unknown as ViewType<G> // XXX: investigate this
}

export type AxisType = "linear" | "log" | "categorical"

function make_scale(axis: "x" | "y", axis_type: AxisType, reversed: boolean): Scale {
  let end: number, start: number

  switch (axis) {
    case "x": {
      [start, end] = [0, 200]
      break
    }
    case "y": {
      [start, end] = [200, 0]
      break
    }
    default:
      throw new Error("unrechable code")
  }

  if (reversed) {
    [start, end] = [end, start]
  }

  switch (axis_type) {
    case "linear":
      return new LinearScale({
        source_range: new Range1d({start: 0, end: 100}),
        target_range: new Range1d({start, end}),
      })
    case "log":
      return new LogScale({
        source_range: new Range1d({start: 1, end: 1000}),
        target_range: new Range1d({start, end}),
      })
    case "categorical":
      return new CategoricalScale({
        source_range: new FactorRange({factors:["a", "b"], range_padding: 0}),
        target_range: new Range1d({start, end}),
      })
    default:
      throw new Error(`unknown scale type: ${axis_type}`)
  }
}

export function set_scales(glyph_view: GlyphView, axis_type: AxisType, reversed: boolean = false): void {
  const xscale = make_scale("x", axis_type, reversed)
  const yscale = make_scale("y", axis_type, reversed)

  glyph_view.renderer.xscale = xscale
  glyph_view.renderer.yscale = yscale

  glyph_view.renderer.plot_view.frame.xscales.default = xscale
  glyph_view.renderer.plot_view.frame.yscales.default = yscale
}
