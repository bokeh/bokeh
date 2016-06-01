_ = require "underscore"

Annotation = require "./annotation"
p = require "../../core/properties"
{get_text_height} = require "../../core/util/text"

class LegendView extends Annotation.View
  initialize: (options) ->
    super(options)

  compute_legend_bbox: () ->
    legend_names = (legend_name for [legend_name, glyphs] in @mget("legends"))

    glyph_height = @mget('glyph_height')
    glyph_width = @mget('glyph_width')

    label_height = @mget('label_height')
    label_width = @mget('label_width')

    legend_spacing = @mget('legend_spacing')

    @max_label_height = _.max(
      [get_text_height(@visuals.label_text.font_value()), label_height, glyph_height]
    )

    # this is to measure text properties
    ctx = @plot_view.canvas_view.ctx
    ctx.save()
    @visuals.label_text.set_value(ctx)
    @text_widths = {}
    for name in legend_names
      @text_widths[name] = _.max([ctx.measureText(name).width, label_width])
    ctx.restore()

    max_label_width = _.max(_.values(@text_widths))

    legend_padding = @mget('legend_padding')

    if @mget("orientation") == "vertical"
      legend_height = (legend_names.length * @max_label_height + (1 + legend_names.length) * legend_spacing) + legend_padding * 2
      legend_width = (max_label_width + glyph_width + 3 * legend_spacing) + legend_padding * 2
    else
      legend_width = 0
      for name, width of @text_widths
        legend_width += (_.max([width, label_width]) + glyph_width + 3 * legend_spacing)
      legend_width += legend_padding
      legend_height = (@max_label_height + 2 * legend_spacing) + legend_padding * 2

    location = @mget('location')
    h_range = @plot_view.frame.get('h_range')
    v_range = @plot_view.frame.get('v_range')

    if _.isString(location)
      switch location
        when 'top_left'
          x = h_range.get('start') + legend_padding
          y = v_range.get('end') - legend_padding
        when 'top_center'
          x = (h_range.get('end') + h_range.get('start'))/2 - legend_width/2
          y = v_range.get('end') - legend_padding
        when 'top_right'
          x = h_range.get('end') - legend_padding - legend_width
          y = v_range.get('end') - legend_padding
        when 'right_center'
          x = h_range.get('end') - legend_padding - legend_width
          y = (v_range.get('end') + v_range.get('start'))/2 + legend_height/2
        when 'bottom_right'
          x = h_range.get('end') - legend_padding - legend_width
          y = v_range.get('start') + legend_padding + legend_height
        when 'bottom_center'
          x = (h_range.get('end') + h_range.get('start'))/2 - legend_width/2
          y = v_range.get('start') + legend_padding + legend_height
        when 'bottom_left'
          x = h_range.get('start') + legend_padding
          y = v_range.get('start') + legend_padding + legend_height
        when 'left_center'
          x = h_range.get('start') + legend_padding
          y = (v_range.get('end') + v_range.get('start'))/2 + legend_height/2
        when 'center'
          x = (h_range.get('end') + h_range.get('start'))/2 - legend_width/2
          y = (v_range.get('end') + v_range.get('start'))/2 + legend_height/2
    else if _.isArray(location) and location.length == 2
      [x, y] = location

    x = @plot_view.canvas.vx_to_sx(x)
    y = @plot_view.canvas.vy_to_sy(y)

    return {x: x, y: y, width: legend_width, height: legend_height}

  render: () ->
    if @model.legends.length == 0
      return

    bbox = @compute_legend_bbox()

    glyph_height = @mget('glyph_height')
    glyph_width = @mget('glyph_width')
    orientation = @mget('orientation')

    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    if @model.panel?
      panel_offset = @_get_panel_offset()
      ctx.translate(panel_offset.x, panel_offset.y)

    ctx.beginPath()
    ctx.rect(bbox.x, bbox.y, bbox.width, bbox.height)

    @visuals.background_fill.set_value(ctx)
    ctx.fill()
    if @visuals.border_line.doit
      @visuals.border_line.set_value(ctx)
      ctx.stroke()

    legend_padding = @mget('legend_padding')
    legend_spacing = @mget('legend_spacing')
    N = @mget("legends").length

    xoffset = 0
    yoffset = 0
    for [legend_name, glyphs], idx in @mget("legends")
      if orientation == "vertical"
        x1 = bbox.x + legend_spacing + legend_padding
        x2 = x1 + glyph_width
        y1 = bbox.y + yoffset + legend_spacing + legend_padding
        y2 = y1 + glyph_height
        yoffset += (bbox.height/N) - legend_padding
      else
        x1 = bbox.x + xoffset + legend_spacing + legend_padding
        x2 = x1 + glyph_width
        y1 = bbox.y + legend_spacing + legend_padding
        y2 = y1 + glyph_height
        xoffset += @text_widths[legend_name] + 3*legend_spacing + glyph_width

      tx = x2 + legend_spacing
      ty = y1 + @max_label_height / 2.0

      @visuals.label_text.set_value(ctx)
      ctx.fillText(legend_name, tx, ty)
      for renderer in glyphs
        view = @plot_view.renderer_views[renderer.id]
        view.draw_legend(ctx, x1, x2, y1, y2)

    ctx.restore()

  _get_size: () ->
    bbox = @compute_legend_bbox()
    side = @model.panel.side
    if side == 'above' or side == 'below'
      return bbox.height
    if side == 'left' or side == 'right'
      return bbox.width

  _get_panel_offset: () ->
    # Legends draw from the top down, so set the y_panel_offset to _top
    x = @model.panel._left._value
    y = @model.panel._top._value
    return {x: x, y: -y}

class Legend extends Annotation.Model
  default_view: LegendView

  type: 'Legend'

  @mixins ['text:label_', 'line:border_', 'fill:background_']

  @define {
      legends:        [ p.Array,          []          ]
      orientation:    [ p.Orientation,    'vertical'  ]
      location:       [ p.Any,            'top_right' ] # TODO (bev)
      label_standoff: [ p.Number,         15          ]
      glyph_height:   [ p.Number,         20          ]
      glyph_width:    [ p.Number,         20          ]
      label_height:   [ p.Number,         20          ]
      label_width:    [ p.Number,         50          ]
      legend_padding: [ p.Number,         10          ]
      legend_spacing: [ p.Number,         3           ]
  }

  @override {
    border_line_color: "#e5e5e5"
    border_line_alpha: 0.5
    border_line_width: 1
    background_fill_color: "#fffff"
    background_fill_alpha: 0.95
    label_text_font_size: "10pt"
    label_text_baseline: "middle"
  }

module.exports =
  Model: Legend
  View: LegendView
