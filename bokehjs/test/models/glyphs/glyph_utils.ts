import * as sinon from "sinon"

import {Arrayable} from "core/types"
import {Document} from "document"
import {Range1d} from "models/ranges/range1d"
import {Plot, PlotView} from "models/plots/plot"
import {Glyph, GlyphView} from "models/glyphs/glyph"
import {GlyphRenderer, GlyphRendererView} from "models/renderers/glyph_renderer"
import {ColumnDataSource} from "models/sources/column_data_source"
import {Scale} from "models/scales/scale"
import {LinearScale} from "models/scales/linear_scale"
import {LogScale} from "models/scales/log_scale"
import {CategoricalScale} from "models/scales/categorical_scale"
import {FactorRange} from "models/ranges/factor_range"

export function create_glyph_renderer_view(glyph: Glyph, data: {[key: string]: Arrayable} = {}): GlyphRendererView {
  /*
   * Requires stubbing the canvas and solver before calling.
   */
  const doc = new Document()
  const plot = new Plot({
    x_range: new Range1d({start: 0, end: 1}),
    y_range: new Range1d({start: 0, end: 1}),
  })
  const plot_view = new plot.default_view({model: plot, parent: null}) as PlotView
  doc.add_root(plot)

  const plot_canvas_view = plot_view.plot_canvas_view
  sinon.stub(plot_canvas_view, "update_constraints")

  const data_source = new ColumnDataSource({data})

  const glyph_renderer = new GlyphRenderer({
    glyph,
    data_source: data_source,
  })

  const glyph_renderer_view = new glyph_renderer.default_view({
    model: glyph_renderer,
    plot_view: plot_canvas_view,
    parent: plot_canvas_view,
  }) as GlyphRendererView

  return glyph_renderer_view
}

export function create_glyph_view(glyph: Glyph, data: {[key: string]: Arrayable} = {}): GlyphView {
  return create_glyph_renderer_view(glyph, data).glyph /* glyph_view */
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

  glyph_view.renderer.plot_view.frame.xscales["default"] = xscale
  glyph_view.renderer.plot_view.frame.yscales["default"] = yscale
}
