
base = require("./base")
primitive = require("./primitive_glyphs")
schema_renderers = require("./schema_renderers")

XYRendererView = schema_renderers.XYRendererView
HasParent = base.HasParent



class GlyphRendererView extends XYRendererView
  initialize: (options) ->
    super(options)
    @arc       = primitive.arc
    @area      = primitive.area
    @bezier    = primitive.bezier
    @circle    = primitive.circle
    @image     = primitive.image
    @line      = primitive.line
    @oval      = primitive.oval
    @quad      = primitive.quad
    @quadcurve = primitive.quadcurve
    @ray       = primitive.ray
    @rect      = primitive.rect
    @segment   = primitive.segment
    @text      = primitive.text
    @wedge     = primitive.wedge

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

  map_to_screen : (glyph, xname, yname, data) ->
    sx = new Array(data.length)
    sy = new Array(data.length)

    x_units = glyph[xname].units
    y_units = glyph[yname].units

    if x_units == "screen"
      for i in [0..data.length-1]
        sx[i] = glyph.select(xname, data[i])
    else
      for i in [0..data.length-1]
        sx[i] = @plot_view.viewstate.xpos(@xmapper.map_screen(glyph.select(xname, data[i])))

    if y_units == "screen"
      for i in [0..data.length-1]
        sy[i] = glyph.select(yname, data[i])
    else
      for i in [0..data.length-1]
        sy[i] = @plot_view.viewstate.ypos(@ymapper.map_screen(glyph.select(yname, data[i])))

    return [sx, sy]


  map_to_screen2 : (x, x_units, y, y_units) ->
    sx = new Array(x.length)
    sy = new Array(y.length)

    if x_units == "screen"
      sx = x
    else
      for i in [0..x.length-1]
        sx[i] = @plot_view.viewstate.xpos(@xmapper.map_screen(x[i]))

    if y_units == "screen"
      sy = y
    else
      for i in [0..y.length-1]
        sy[i] = @plot_view.viewstate.ypos(@ymapper.map_screen(y[i]))

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
  fill_alpha: 1.0

  line_color: 'red'
  line_width: 1
  line_alpha: 1.0
  line_join: "miter"
  line_cap: "butt"
  line_dash: ""

  font: "helvetica"
  font_size: "12px"
  font_style: "normal"
  font_color: "gray"
  font_alpha: 1.0
  text_align: "left"
  text_baseline: "bottom"

  radius : 5
  radius:
    units: "screen"

  angle:
    units: 'deg'
  start_angle:
    units: 'deg'
  end_angle:
    units: 'deg'

})


class GlyphRenderers extends Backbone.Collection
  model : GlyphRenderer

exports.glyphrenderers = new GlyphRenderers
exports.GlyphRendererView = GlyphRendererView
exports.GlyphRenderer = GlyphRenderer
