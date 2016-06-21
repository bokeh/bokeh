TextAnnotation = require "./text_annotation"
p = require "../../core/properties"
{Visuals} = require "../renderers/renderer"

class TitleView extends TextAnnotation.View

  initialize: (options) ->
    super(options)
    @visuals.text = new Visuals.text({obj: @model, prefix: ""})

    # Use side_panel heuristics to determine unset text props
    ctx = @plot_view.canvas_view.ctx
    ctx.save()
    @model.panel.apply_label_text_heuristics(ctx, 'justified')
    @model.text_baseline = ctx.textBaseline
    @model.text_align = @model.align
    ctx.restore()

  _get_computed_location: () ->
    [width, height] = @_calculate_text_dimensions(@plot_view.canvas_view.ctx, @text)
    switch @model.panel.side
      when 'left'
        vx = 0
        vy = @_get_text_location(@mget('align'), @frame.get('v_range')) + @mget('offset')
      when 'right'
        vx = @canvas.get('right') - 1 #fudge factor due to error in text height measurement
        vy = @canvas.get('height') - @_get_text_location(@mget('align'), @frame.get('v_range')) - @mget('offset')
      when 'above'
        vx = @_get_text_location(@mget('align'), @frame.get('h_range')) + @mget('offset')
        vy = @canvas.get('top') - 10 # Corresponds to the +10 added in get_size
      when 'below'
        vx = @_get_text_location(@mget('align'), @frame.get('h_range')) + @mget('offset')
        vy = 0

    sx = @canvas.vx_to_sx(vx)
    sy = @canvas.vy_to_sy(vy)
    return [sx, sy]

  _get_text_location: (alignment, range) ->
    switch alignment
      when 'left'
        text_location = range.get('start')
      when 'center'
        text_location = (range.get('end') + range.get('start'))/2
      when 'right'
        text_location = range.get('end')
    return text_location

  render: () ->
    angle = @model.panel.get_label_angle_heuristic('parallel')
    [sx, sy] = @_get_computed_location()
    ctx = @plot_view.canvas_view.ctx

    if @model.text == "" or @model.text == null
      return

    if @model.render_mode == 'canvas'
      @_canvas_text(ctx, @model.text, sx, sy, angle)
    else
      @_css_text(ctx, @model.text, sx, sy, angle)

  _get_size: () ->
    text = @model.text
    if text == "" or text == null
      return 0
    else
      ctx = @plot_view.canvas_view.ctx
      @visuals.text.set_value(ctx)
      return ctx.measureText(text).ascent + 10

class Title extends TextAnnotation.Model
  default_view: TitleView

  type: 'Title'

  @mixins ['line:border_', 'fill:background_']

  @define {
    text:            [ p.String,                   ]
    text_font:       [ p.Font,         'helvetica' ]
    text_font_size:  [ p.FontSizeSpec, '10pt'      ]
    text_font_style: [ p.FontStyle,    'bold'      ]
    text_color:      [ p.ColorSpec,    '#444444'   ]
    text_alpha:      [ p.NumberSpec,   1.0         ]
    align:           [ p.TextAlign,   'left'       ]
    offset:          [ p.Number,      0            ]
    render_mode:     [ p.RenderMode,  'canvas'     ]
  }

  @override {
    background_fill_color: null
    border_line_color: null
  }

  # these are set by heuristics
  @internal {
    text_align:    [ p.TextAlign,     'left'  ]
    text_baseline: [ p.TextBaseline, 'bottom' ]
  }

module.exports =
  Model: Title
  View: TitleView
