utils = require "../../utils"
sinon = require 'sinon'

{Document} = utils.require("document")
{Range1d} = utils.require("models/ranges/range1d")
{Plot} = utils.require("models/plots/plot")
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")
{ColumnDataSource} = utils.require('models/sources/column_data_source')
{PlotCanvasView} = utils.require('models/plots/plot_canvas')
{Range1d} = utils.require("models/ranges/range1d")
{LinearScale} = utils.require("models/scales/linear_scale")
{LogScale} = utils.require("models/scales/log_scale")
{CategoricalScale} = utils.require("models/scales/categorical_scale")
{Range1d} = utils.require("models/ranges/range1d")
{FactorRange} = utils.require("models/ranges/factor_range")

create_glyph_view = (glyph, data={}, return_renderer_view=false) ->
  ###
  Requires stubbing the canvas and solver before calling
  ###
  doc = new Document()
  plot = new Plot({
    x_range: new Range1d({start: 0, end: 1})
    y_range: new Range1d({start: 0, end: 1})
  })
  plot_view = new plot.default_view({model: plot, parent: null})
  doc.add_root(plot)
  plot_canvas_view = new plot.plot_canvas.default_view({model: plot.plot_canvas, parent: plot_view})
  sinon.stub(plot_canvas_view, 'update_constraints')

  @data_source = new ColumnDataSource({data: data})

  glyph_renderer = new GlyphRenderer({
    glyph: glyph
    data_source: @data_source
  })

  glyph_renderer_view = new glyph_renderer.default_view({
    model: glyph_renderer
    plot_view: plot_canvas_view
    parent: plot_canvas_view
  })

  if return_renderer_view
    return glyph_renderer_view
  else
    return glyph_renderer_view.glyph

make_scale = (axis, type, reversed) ->
  switch axis
    when "x" then [start, end] = [0, 200]
    when "y" then [start, end] = [200, 0]

  if reversed
    [start, end] = [end, start]

  switch type
    when "linear"
      return new LinearScale({
        source_range: new Range1d({start: 0, end: 100})
        target_range: new Range1d({start: start, end: end})
      })
    when "log"
      return new LogScale({
        source_range: new Range1d({start: 1, end: 1000})
        target_range: new Range1d({start: start, end: end})
      })
    when "categorical"
      return new CategoricalScale({
        source_range: new FactorRange({factors:['a', 'b'], range_padding: 0})
        target_range: new Range1d({start: start, end: end})
      })
    else
      throw new Error("unknown scale type: #{type}")

set_scales = (glyph_view, type, reversed=false) ->
  xscale = make_scale("x", type, reversed)
  yscale = make_scale("y", type, reversed)

  glyph_view.renderer.xscale = xscale
  glyph_view.renderer.yscale = yscale
  glyph_view.renderer.plot_view.frame.xscales['default'] = xscale
  glyph_view.renderer.plot_view.frame.yscales['default'] = yscale

module.exports = {
  create_glyph_view: create_glyph_view,
  set_scales: set_scales,
}
