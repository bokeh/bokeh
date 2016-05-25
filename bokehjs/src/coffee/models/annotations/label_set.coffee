_ = require "underscore"
$ = require "jquery"

TextAnnotation = require "./text_annotation"
ColumnDataSource = require "../sources/column_data_source"
p = require "../../core/properties"

class LabelSetView extends TextAnnotation.View
  initialize: (options) ->
    super(options)

    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    @set_data(@mget('source'))
    @set_visuals(@mget('source'))

    if @mget('render_mode') == 'css'
      for i in [0...@_text.length]
        @title_div = $("<div>").addClass('bk-annotation-child').hide()
        @title_div.appendTo(@$el)

  bind_bokeh_events: () ->
    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'change', () ->
        @set_data(@mget('source'))
        @render())
      @listenTo(@mget('source'), 'change', () ->
        @set_data(@mget('source'))
        @render())
    else
      @listenTo(@model, 'change', () ->
        @set_data(@mget('source'))
        @plot_view.request_render())
      @listenTo(@mget('source'), 'change', () ->
        @set_data(@mget('source'))
        @plot_view.request_render())

  _map_data: () ->
    if @mget('x_units') == "data"
      vx = @xmapper.v_map_to_target(@_x)
    else
      vx = @_x.slice(0) # make deep copy to not mutate
    sx = @canvas.v_vx_to_sx(vx)

    if @mget('y_units') == "data"
      vy = @ymapper.v_map_to_target(@_y)
    else
      vy = @_y.slice(0) # make deep copy to not mutate
    sy = @canvas.v_vy_to_sy(vy)

    return [sx, sy]

  render: () ->
    ctx = @plot_view.canvas_view.ctx

    [sx, sy] = @_map_data()

    if @mget('render_mode') == 'canvas'
      for i in [0...@_text.length]
        @_v_canvas_text(ctx, i, @_text[i], sx[i] + @_x_offset[i], sy[i] - @_y_offset[i], @_angle[i])
    else
      for i in [0...@_text.length]
        @_v_css_text(ctx, i, @_text[i], sx[i] + @_x_offset[i], sy[i] - @_y_offset[i], @_angle[i])

  _get_size: () ->
    ctx = @plot_view.canvas_view.ctx
    @visuals.text.set_value(ctx)

    side = @model.panel.side
    if side == "above" or side == "below"
      height = ctx.measureText(@_text[0]).ascent
      return height
    if side == 'left' or side == 'right'
      width = ctx.measureText(@_text[0]).width
      return width

  _v_canvas_text: (ctx, i, text, sx, sy, angle) ->
    @visuals.text.set_vectorize(ctx, i)
    bbox_dims = @_calculate_bounding_box_dimensions(ctx, text)

    ctx.save()

    ctx.beginPath()
    ctx.translate(sx, sy)
    ctx.rotate(angle)

    ctx.rect(bbox_dims[0], bbox_dims[1], bbox_dims[2], bbox_dims[3])

    if @visuals.background_fill.doit
      @visuals.background_fill.set_vectorize(ctx, i)
      ctx.fill()

    if @visuals.border_line.doit
      @visuals.border_line.set_vectorize(ctx, i)
      ctx.stroke()

    if @visuals.text.doit
      @visuals.text.set_vectorize(ctx, i)
      ctx.fillText(text, 0, 0)

    ctx.restore()

  _v_css_text: (ctx, i, text, sx, sy, angle) ->
    @visuals.text.set_vectorize(ctx, i)
    bbox_dims = @_calculate_bounding_box_dimensions(ctx, text)

    # attempt to support vector-style ("8 4 8") line dashing for css mode
    ld = @visuals.border_line.line_dash.value()
    if _.isArray(ld)
      if ld.length < 2
        line_dash = "solid"
      else
        line_dash = "dashed"
    if _.isString(ld)
        line_dash = ld

    @visuals.border_line.set_vectorize(ctx, i)
    @visuals.background_fill.set_vectorize(ctx, i)

    div_style = {
      'position': 'absolute'
      'left': "#{sx + bbox_dims[0]}px"
      'top': "#{sy + bbox_dims[1]}px"
      'color': "#{@visuals.text.text_color.value()}"
      'opacity': "#{@visuals.text.text_alpha.value()}"
      'font': "#{@visuals.text.font_value()}"
      'line-height': "normal" # needed to prevent ipynb css override
      }

    if angle
      _.extend(div_style, {
        'transform': "rotate(#{angle}rad)"
        })

    if @visuals.background_fill.doit
      _.extend(div_style, {
        'background-color': "#{@visuals.background_fill.color_value()}"
      })

    if @visuals.border_line.doit
      _.extend(div_style, {
        'border-style': "#{line_dash}"
        'border-width': "#{@visuals.border_line.line_width.value()}"
        'border-color': "#{@visuals.border_line.color_value()}"
      })

    @$el.children().eq(i)
                   .html(text)
                   .css(div_style)
                   .show()

class LabelSet extends TextAnnotation.Model
  default_view: LabelSetView

  type: 'Label'

  @mixins ['text', 'line:border_', 'fill:background_']

  @coords [['x', 'y']]

  @define {
      x_units:      [ p.SpatialUnits, 'data'            ]
      y_units:      [ p.SpatialUnits, 'data'            ]
      text:         [ p.StringSpec,   { field: "text" } ]
      angle:        [ p.AngleSpec,    0                 ]
      x_offset:     [ p.NumberSpec,   { value: 0 }      ]
      y_offset:     [ p.NumberSpec,   { value: 0 }      ]
      source:       [ p.Instance,     () -> new ColumnDataSource.Model()  ]
      x_range_name: [ p.String,      'default'          ]
      y_range_name: [ p.String,      'default'          ]
      render_mode:  [ p.RenderMode,  'canvas'           ]
    }

  @override {
    background_fill_color: null
    border_line_color: null
  }

module.exports =
  Model: LabelSet
  View: LabelSetView
