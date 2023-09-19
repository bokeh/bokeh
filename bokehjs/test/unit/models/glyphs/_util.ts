import {display} from "../../_util"

import type {Arrayable} from "@bokehjs/core/types"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot} from "@bokehjs/models/plots/plot"
import type {Glyph} from "@bokehjs/models/glyphs/glyph"
import type {GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import type {Scale} from "@bokehjs/models/scales/scale"
import type {Range} from "@bokehjs/models/ranges/range"
import {LinearScale} from "@bokehjs/models/scales/linear_scale"
import {LogScale} from "@bokehjs/models/scales/log_scale"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import type {ViewOf} from "@bokehjs/core/view"
import type * as p from "@bokehjs/core/properties"

type FilteredKeys<T, U> = {[P in keyof T]: T[P] extends U ? P : never}[keyof T]

type SpecsOf<P> = {[K in FilteredKeys<P, p.VectorSpec<any, any>>]: P[K] extends p.VectorSpec<infer T, any> ? Arrayable<T> : never}
export type DataOf<G extends Glyph> = Partial<SpecsOf<G["properties"]>>

export type Options = {
  axis_type?: AxisType
  reversed?: boolean
  x_range?: Range
  y_range?: Range
}

export async function create_glyph_renderer_view<G extends Glyph>(glyph: G, data: DataOf<G> = {}, options: Options = {}): Promise<GlyphRendererView> {
  const axis_type = options.axis_type ?? "linear"

  const data_source = new ColumnDataSource({data: data as {[key: string]: Arrayable}}) // TODO: exactOptionalPropertyTypes
  const glyph_renderer = new GlyphRenderer({glyph, data_source})

  const [x_range, x_scale] = make_scale("x", axis_type, options.x_range)
  const [y_range, y_scale] = make_scale("y", axis_type, options.y_range)

  const plot = new Plot({
    width: 200, height: 200,
    x_range, y_range,
    x_scale, y_scale,
    min_border: 0,
    toolbar_location: null,
    title: null,
    renderers: [glyph_renderer],
  })

  const {view} = await display(plot)
  return view.owner.get_one(glyph_renderer)
}

export async function create_glyph_view<G extends Glyph>(glyph: G, data: DataOf<G> = {}, options?: Options): Promise<ViewOf<G>> {
  return (await create_glyph_renderer_view(glyph, data, options)).glyph
}

export type AxisType = "linear" | "log" | "categorical"

function make_scale(_axis: "x" | "y", axis_type: AxisType, range?: Range): [Range, Scale] {
  switch (axis_type) {
    case "linear":
      return [range ?? new Range1d({start: 0, end: 100}), new LinearScale()]
    case "log":
      return [range ?? new Range1d({start: 1, end: 1000}), new LogScale()]
    case "categorical":
      return [range ?? new FactorRange({factors: ["a", "b"], range_padding: 0}), new CategoricalScale()]
  }
}
