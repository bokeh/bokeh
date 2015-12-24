_ = require "underscore"
Annotation = require "./annotation"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"
textutils = require "../../common/textutils"

# Legends:
#
# legend_padding is the boundary between the legend and the edge of the plot
# legend_spacing goes between each legend entry and the edge of the legend,
# as well as between 2 adjacent legend entries.  It is also the space between
# the legend label, and the legend glyph.
#
# A legend in the top right corner looks like this
#
# plotborder
# padding
# legendborder
# spacing
# legendborder|spacing|label|spacing|glyph|spacing|legendborder|padding|plotborder
# spacing
# legendborder|spacing|label|spacing|glyph|spacing|legendborder|padding|plotborder
# spacing
# border

class LegendView extends PlotWidget
  initialize: (options) ->
    super(options)
    @label_props = new properties.Text({obj:@model, prefix: 'label_'})
    @border_props = new properties.Line({obj: @model, prefix: 'border_'})
    @background_props = new properties.Fill({obj: @model, prefix: 'background_'})
    @need_calc_dims = true
    @listenTo(@plot_model.solver, 'layout_update', () -> @need_calc_dims = true)

  calc_dims: (options) ->
    legend_names = (legend_name for [legend_name, glyphs] in @mget("legends"))
    label_height = @mget('label_height')
    @glyph_height = @mget('glyph_height')
    label_width = @mget('label_width')
    @glyph_width = @mget('glyph_width')
    legend_spacing = @mget('legend_spacing')
    @label_height = _.max(
      [textutils.getTextHeight(@label_props.font_value()),
       label_height, @glyph_height])
    @legend_height = @label_height
    #add legend spacing
    @legend_height = (legend_names.length * @legend_height +
                      (1 + legend_names.length) * legend_spacing)
    ctx = @plot_view.canvas_view.ctx
    ctx.save()
    @label_props.set_value(ctx)
    text_widths = _.map(legend_names, (txt) -> ctx.measureText(txt).width)
    ctx.restore()

    text_width = _.max(text_widths)
    @label_width = _.max([text_width, label_width])
    @legend_width = @label_width + @glyph_width + 3 * legend_spacing
    location = @mget('location')
    legend_padding = @mget('legend_padding')
    h_range = @plot_view.frame.get('h_range')
    v_range = @plot_view.frame.get('v_range')

    if _.isString(location)
      switch location
        when 'top_left'
          x = h_range.get('start') + legend_padding
          y = v_range.get('end') - legend_padding
        when 'top_center'
          x = (h_range.get('end') + h_range.get('start'))/2 - @legend_width/2
          y = v_range.get('end') - legend_padding
        when 'top_right'
          x = h_range.get('end') - legend_padding - @legend_width
          y = v_range.get('end') - legend_padding
        when 'right_center'
          x = h_range.get('end') - legend_padding - @legend_width
          y = (v_range.get('end') + v_range.get('start'))/2 + @legend_height/2
        when 'bottom_right'
          x = h_range.get('end') - legend_padding - @legend_width
          y = v_range.get('start') + legend_padding + @legend_height
        when 'bottom_center'
          x = (h_range.get('end') + h_range.get('start'))/2 - @legend_width/2
          y = v_range.get('start') + legend_padding + @legend_height
        when 'bottom_left'
          x = h_range.get('start') + legend_padding
          y = v_range.get('start') + legend_padding + @legend_height
        when 'left_center'
          x = h_range.get('start') + legend_padding
          y = (v_range.get('end') + v_range.get('start'))/2 + @legend_height/2
        when 'center'
          x = (h_range.get('end') + h_range.get('start'))/2 - @legend_width/2
          y = (v_range.get('end') + v_range.get('start'))/2 + @legend_height/2
    else if _.isArray(location) and location.length == 2
      [x, y] = location

    x = @plot_view.canvas.vx_to_sx(x)
    y = @plot_view.canvas.vy_to_sy(y)
    @box_coords = [x,y]

  render: () ->
    if @need_calc_dims
      @calc_dims()
      @need_calc_dims = false
    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    ctx.beginPath()
    ctx.rect(@box_coords[0], @box_coords[1],
      @legend_width, @legend_height
    )
    # Populate background fill properties (fill_color/fill_alpha) for legend,
    # defaulting to opaque white
    @background_props.set_value(ctx)
    ctx.fill()
    if @border_props.do_stroke
      @border_props.set_value(ctx)
      ctx.stroke()
    legend_spacing = @mget('legend_spacing')
    for [legend_name, glyphs], idx in @mget("legends")
      yoffset = idx * @label_height
      yspacing = (1 + idx) * legend_spacing
      y = @box_coords[1] +  @label_height / 2.0 + yoffset + yspacing
      x = @box_coords[0] + legend_spacing
      x1 = @box_coords[0] + 2 * legend_spacing + @label_width
      x2 = x1 + @glyph_width
      y1 = @box_coords[1] + yoffset + yspacing
      y2 = y1 + @glyph_height
      @label_props.set_value(ctx)
      ctx.fillText(legend_name, x, y)
      for renderer in @model.resolve_ref(glyphs)
        view = @plot_view.renderers[renderer.id]
        view.draw_legend(ctx, x1, x2, y1, y2)

    ctx.restore()

class Legend extends Annotation.Model
  default_view: LegendView
  type: 'Legend'

  defaults: ->
    return _.extend {}, super(), {
      legends: []
    }

  display_defaults: ->
    return _.extend {}, super(), {
      border_line_color: 'black'
      border_line_width: 1
      border_line_alpha: 1.0
      border_line_join: 'miter'
      border_line_cap: 'butt'
      border_line_dash: []
      border_line_dash_offset: 0

      background_fill_color: "#ffffff"
      background_fill_alpha: 1.0

      label_standoff: 15
      label_text_font: "helvetica"
      label_text_font_size: "10pt"
      label_text_font_style: "normal"
      label_text_color: "#444444"
      label_text_alpha: 1.0
      label_text_align: "left"
      label_text_baseline: "middle"

      glyph_height: 20
      glyph_width: 20
      label_height: 20
      label_width: 50
      legend_padding: 10
      legend_spacing: 3
      location: 'top_right'
    }

module.exports =
  Model: Legend
  View: LegendView
