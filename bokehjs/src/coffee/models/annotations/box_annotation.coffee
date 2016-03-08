_ = require "underscore"
$ = require "jquery"

Annotation = require "./annotation"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class BoxAnnotationView extends Renderer.View
  initialize: (options) ->
    super(options)
    # if @mget('source')?
    @set_data(@mget('source'))
    @indices = [0...Math.max(@mget('top')?.length, @mget('bottom')?.length, @mget('left')?.length, @mget('right')?.length)]
    @box_div = (null for i in @indices)
    @frame = @plot_model.get('frame')
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

  bind_bokeh_events: () ->
    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'data_update', @render)
    else
      @listenTo(@model, 'data_update', @plot_view.request_render)

  render: () ->
    sleft = @canvas.v_vx_to_sx(@_calc_dim('left', @xmapper, @frame.get('h_range').get('start')))
    sright = @canvas.v_vx_to_sx(@_calc_dim('right', @xmapper, @frame.get('h_range').get('end')))
    sbottom = @canvas.v_vy_to_sy(@_calc_dim('bottom', @ymapper, @frame.get('v_range').get('start')))
    stop = @canvas.v_vy_to_sy(@_calc_dim('top', @ymapper, @frame.get('v_range').get('end')))

    if @mget('render_mode') == 'css'
      @_css_box(sleft, sright, sbottom, stop)

    else
      @_canvas_box(sleft, sright, sbottom, stop)

  _css_box: (sleft, sright, sbottom, stop) ->
    for i in @indices

      if @box_div[i] == null
        @box_div[i] = $("<div>").addClass('shading')
        @box_div[i].appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))
        @$el.hide()

      # don't render if *all* position are null
      if not @mget('left')? and not @mget('right')? and not @mget('top')? and not @mget('bottom')?
        continue

      # try our best to honor line dashing in some way, if we can
      if _.isArray(@mget("line_dash"))
        if @mget("line_dash").length < 2
          ld = "solid"
        else
          ld = "dashed"
      if _.isString(@mget("line_dash"))
          ld = @mget("line_dash")

      @box_div[i].css({
        "position": "absolute"
        "left": "#{sleft[i]}px"
        "width": "#{Math.abs(sright[i]-sleft[i])}px"
        "top": "#{stop[i]}px"
        "height": "#{Math.abs(sbottom[i]-stop[i])}px"
        "border-width": "#{@line_width[i]}"
        "border-color": "#{@line_color[i]}"
        "border-style": "#{ld}"
        "background-color": "#{@fill_color[i]}"
        "opacity": "#{@fill_alpha[i]}"
        })
      @box_div[i].show()

  _canvas_box: (sleft, sright, sbottom, stop) ->
    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    ctx.beginPath()
    ctx.rect(sleft, stop, sright-sleft, sbottom-stop)

    @visuals.fill.set_value(ctx)
    ctx.fill()

    @visuals.line.set_value(ctx)
    ctx.stroke()

    ctx.restore()

  _calc_dim: (dim, mapper, frame_extrema) ->
    vdim = []
    for value in @[dim]
      if value?
        if @mget(dim+'_units') == 'data'
          vdim.push(mapper.map_to_target(value))
        else
          vdim.push(value)
      else
        vdim.push(frame_extrema)
    return vdim

class BoxAnnotation extends Annotation.Model
  default_view: BoxAnnotationView

  type: 'BoxAnnotation'

  mixins: ['line', 'fill']
  coords: ['top', 'bottom', 'left', 'right']

  props: ->
    return _.extend {}, super(), {
      render_mode:  [ p.RenderMode,   'canvas'  ]
      x_range_name: [ p.String,       'default' ]
      y_range_name: [ p.String,       'default' ]
      top:          [ p.NumberSpec,   null      ]
      top_units:    [ p.SpatialUnits, 'data'    ]
      bottom:       [ p.NumberSpec,   null      ]
      bottom_units: [ p.SpatialUnits, 'data'    ]
      left:         [ p.NumberSpec,   null      ]
      left_units:   [ p.SpatialUnits, 'data'    ]
      right:        [ p.NumberSpec,   null      ]
      right_units:  [ p.SpatialUnits, 'data'    ]
      source:       [ p.Instance,               ]
    }

  defaults: ->
    return _.extend {}, super(), {
      # overrides
      fill_color: '#fff9ba'
      fill_alpha: 0.4
      line_color: '#cccccc'
      line_alpha: 0.3

      # internal
      silent_update: false
    }

  nonserializable_attribute_names: () ->
    super().concat(['silent_update'])

  update:({left, right, top, bottom}) ->
    if @get('silent_update')
      @attributes['left'] = left
      @attributes['right'] = right
      @attributes['top'] = top
      @attributes['bottom'] = bottom
    else
      @set({left: left, right: right, top: top, bottom: bottom})
    @trigger('data_update')

module.exports =
  Model: BoxAnnotation
  View: BoxAnnotationView
