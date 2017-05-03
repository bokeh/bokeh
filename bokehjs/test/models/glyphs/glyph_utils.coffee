utils = require "../../utils"
sinon = require 'sinon'

{Document} = utils.require("document")
{Range1d} = utils.require("models/ranges/range1d")
{Plot} = utils.require("models/plots/plot")
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")
{ColumnDataSource} = utils.require('models/sources/column_data_source')
{PlotCanvasView} = utils.require('models/plots/plot_canvas')

create_glyph_view = (glyph, data={}) ->
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

  return glyph_renderer_view.glyph

module.exports = {
  create_glyph_view: create_glyph_view
}
