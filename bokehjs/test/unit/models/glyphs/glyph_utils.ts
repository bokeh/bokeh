import {Arrayable} from "@bokehjs/core/types"
import {Document} from "@bokehjs/document"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot} from "@bokehjs/models/plots/plot"
import {Glyph} from "@bokehjs/models/glyphs/glyph"
import {GlyphRenderer, GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Scale} from "@bokehjs/models/scales/scale"
import {Range} from "@bokehjs/models/ranges/range"
import {LinearScale} from "@bokehjs/models/scales/linear_scale"
import {LogScale} from "@bokehjs/models/scales/log_scale"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {build_view} from "@bokehjs/core/build_views"
import {ViewOf} from "@bokehjs/core/view"

export type Options = {axis_type?: AxisType, reversed?: boolean}

export async function create_glyph_renderer_view(glyph: Glyph, data: {[key: string]: Arrayable} = {}, options?: Options): Promise<GlyphRendererView> {
  const axis_type = options?.axis_type ?? "linear"

  const doc = new Document()

  const data_source = new ColumnDataSource({data})
  const glyph_renderer = new GlyphRenderer({glyph, data_source})

  const [x_range, x_scale] = make_scale("x", axis_type)
  const [y_range, y_scale] = make_scale("y", axis_type)

  const plot = new Plot({
    width: 200, height: 200,
    x_range, y_range,
    x_scale, y_scale,
    min_border: 0,
    toolbar_location: null,
    title: null,
    renderers: [glyph_renderer],
  })
  const plot_view = (await build_view(plot)).build()
  doc.add_root(plot)

  return plot_view.renderer_views.get(glyph_renderer)! as GlyphRendererView
}

export async function create_glyph_view<G extends Glyph>(glyph: G, data: {[key: string]: Arrayable} = {}, options?: Options): Promise<ViewOf<G>> {
  return (await create_glyph_renderer_view(glyph, data, options)).glyph /* glyph_view */ // as unknown as ViewOf<G> // XXX: investigate this
}

export type AxisType = "linear" | "log" | "categorical"

function make_scale(_axis: "x" | "y", axis_type: AxisType): [Range, Scale] {
  switch (axis_type) {
    case "linear":
      return [new Range1d({start: 0, end: 100}), new LinearScale()]
    case "log":
      return [new Range1d({start: 1, end: 1000}), new LogScale()]
    case "categorical":
      return [new FactorRange({factors: ["a", "b"], range_padding: 0}), new CategoricalScale()]
  }
}
