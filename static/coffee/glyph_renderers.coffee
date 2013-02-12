
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
    pt_units = glyph[pt].units
    span_units = glyph[span].units

    if      pt == "x" then mapper = @xmapper
    else if pt == "y" then mapper = @ymapper

    span = (glyph.select(span, x) for x in data)
    if span_units == "screen"
      return span

    if position == "center"
      halfspan = (d / 2 for d in span)
      ptc = (glyph.select(pt, x) for x in data)
      if pt_units == "screen"
        ptc = mapper.v_map_data(ptc)
      pt0 = (ptc[i] - halfspan[i] for i in [0..ptc.length-1])
      pt1 = (ptc[i] + halfspan[i] for i in [0..ptc.length-1])

    else
      pt0 = (glyph.select(pt, x) for x in data)
      if pt_units == "screen"
        pt0 = mapper.v_map_data(pt0)
      pt1 = (pt0[i] + span[i] for i in [0..pt0.length-1])

    spt0 = mapper.v_map_screen(pt0)
    spt1 = mapper.v_map_screen(pt1)

    return (spt1[i] - spt0[i] for i in [0..spt0.length-1])

  map_to_screen : (x, x_units, y, y_units) ->
    sx = new Array(x.length)
    sy = new Array(y.length)

    if x_units == "screen"
      sx = x
    else
      sx = @xmapper.v_map_screen(x)
      sx = @plot_view.viewstate.v_xpos(sx)

    if y_units == "screen"
      sy = y
    else
      sy = @ymapper.v_map_screen(y)
      sy = @plot_view.viewstate.v_ypos(sy)

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
  line_dash: []

  text_font: "helvetica"
  text_font_size: "1em"
  text_font_style: "normal"
  text_color: "#444444"
  text_alpha: 1.0
  text_align: "left"
  text_baseline: "bottom"

  radius : 5
  radius_units: "screen"

  length_units: 'screen'

  angle_units: 'deg'
  start_angle_units: 'deg'
  end_angle_units: 'deg'

})


class GlyphRenderers extends Backbone.Collection
  model : GlyphRenderer

exports.glyphrenderers = new GlyphRenderers
exports.GlyphRendererView = GlyphRendererView
exports.GlyphRenderer = GlyphRenderer
