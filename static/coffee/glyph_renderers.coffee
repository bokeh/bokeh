
base = require("./base")
primitive = require("./primitive_glyphs")
schema_renderers = require("./schema_renderers")

XYRendererView = schema_renderers.XYRendererView
HasParent = base.HasParent



class GlyphRendererView extends XYRendererView
  initialize: (options) ->
    super(options)
    @circle = primitive.circle
    @oval = primitive.oval
    @rect = primitive.rect

  render: () ->
    source = @mget_obj('data_source')
    if source.type == "ObjectArrayDataSource"
      data = source.get('data')
    else if source.type == "ColumnDataSource"
      data = source.datapoints()
    else
      console.log("Unknown data source type: " + source.type)

    for glyph in @mget('glyphs')
      if @[glyph.type]?
        @[glyph.type](@, glyph, data)
      else
        console.log("Unknown glyph type: " + glyph.type)

  distance: (glyph, data, pt, span, position) ->
    results = new Array(data.length)

    pt_units = glyph[pt].units
    span_units = glyph[span].units
    if pt == "x"
      mapper = @xmapper
    else if pt == "y"
      mapper = @ymapper

    if position == "center"

      for i in [0..data.length-1]
        halfspan = glyph.select(span, data[i]) / 2
        if span_units == "screen"
          results[i] = 2 * halfspan
          continue
        ptc = glyph.select(pt, data[i])
        if pt_units == "screen"
          ptc = mapper.map_data(ptc)
        pt0 = ptc - halfspan
        pt1 = ptc + halfspan
        spt0 = mapper.map_screen(pt0)
        spt1 = mapper.map_screen(pt1)
        results[i] = spt1 - spt0

    else

      for i in [0..data.length-1]
        halfspan = glyph.select(span, data[i])
        if span_units == "screen"
          results[i] = halfspan
          continue
        pt0 = glyph.select(pt, data[i])
        if pt_units == "screen"
          pt0 = mapper.map_data(pt0)
        pt1 = pt0 + halfspan
        spt0 = mapper.map_screen(pt0)
        spt1 = mapper.map_screen(pt1)
        results[i] = spt1 - spt0

    return results

  map_to_screen : (glyph, data) ->
    sx = new Array(data.length)
    sy = new Array(data.length)

    x_units = glyph["x"].units
    y_units = glyph["y"].units

    if x_units == "screen"
      for i in [0..data.length-1]
        sx[i] = glyph.select("x", data[i])
    else
      for i in [0..data.length-1]
        sx[i] = @xmapper.map_screen(glyph.select("x", data[i]))

    if y_units == "screen"
      for i in [0..data.length-1]
        sy[i] = glyph.select("y", data[i])
    else
      for i in [0..data.length-1]
        sy[i] = @ymapper.map_screen(glyph.select("y", data[i]))

    return [sx, sy]


class GlyphRenderer extends HasParent
  type : 'GlyphRenderer'
  default_view : GlyphRendererView


GlyphRenderer::defaults = _.clone(GlyphRenderer::defaults)
_.extend(GlyphRenderer::defaults,
  data_source : null
)


GlyphRenderer::display_defaults = _.clone(GlyphRenderer::display_defaults)
_.extend(GlyphRenderer::display_defaults, {

  fill: "gray"
  fill_alpha: 1

  line_color: 'red'
  line_width: 1
  line_alpha: 1
  line_join: "miter"
  line_cap: "butt"
  line_dash: ""

  radius : 5
  radius:
    units: "screen"

  angle:
    units: 'deg'

})


class GlyphRenderers extends Backbone.Collection
  model : GlyphRenderer

exports.glyphrenderers = new GlyphRenderers
exports.GlyphRendererView = GlyphRendererView
exports.GlyphRenderer = GlyphRenderer
