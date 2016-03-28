_ = require "underscore"

Annotation = require "./annotation"
ColumnDataSource = require "../sources/column_data_source"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class BoxAnnotationView extends Renderer.View
  initialize: (options) ->
    super(options)
    if not @mget('source')?
      this.mset('source', new ColumnDataSource.Model())
    @frame = @plot_model.get('frame')
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]
    @set_data()

  bind_bokeh_events: () ->

    if @mget('render_mode') == 'css'
      # dispatch CSS update immediately
      @listenTo(@model, 'change', () ->
        @set_data()
        @render())

      @listenTo(@mget('source'), 'change', () ->
        @set_data()
        @render())

      @listenTo(@model, 'coords_update', () ->
      # non-BB event triggered update
        @_reset_coords()
        @render())

    else
      @listenTo(@model, 'change', () ->
        @set_data()
        @plot_view.request_render())

      @listenTo(@mget('source'), 'change', () ->
        @set_data()
        @plot_view.request_render())

      @listenTo(@model, 'coords_update', () ->
        @_reset_coords()
        @plot_view.request_render())

  set_data: () ->
    super(@mget('source'))
    @set_visuals(@mget('source'))

  _set_data: () ->
    # is called by super(set_data)
    if @box_div?.length != @top.length
      @$el.remove().unbind()
      @box_div = (@$el.clone().addClass('shading') for i in @top)

  _reset_coords: () ->
    @left = [@mget('left')]
    @right = [@mget('right')]
    @bottom = [@mget('bottom')]
    @top = [@mget('top')]

  render: () ->
    if not @mget('left')? and not @mget('right')? and not @mget('top')? and not @mget('bottom')?
      @box_div[0].hide()
      return null

    sleft = @canvas.v_vx_to_sx(@_calc_dim('left', @xmapper, @frame.get('h_range').get('start')))
    sright = @canvas.v_vx_to_sx(@_calc_dim('right', @xmapper, @frame.get('h_range').get('end')))
    sbottom = @canvas.v_vy_to_sy(@_calc_dim('bottom', @ymapper, @frame.get('v_range').get('start')))
    stop = @canvas.v_vy_to_sy(@_calc_dim('top', @ymapper, @frame.get('v_range').get('end')))

    if @mget('render_mode') == 'css'
      @_css_box(sleft, sright, sbottom, stop)

    else
      @_canvas_box(sleft, sright, sbottom, stop)

  _css_box: (sleft, sright, sbottom, stop) ->
    for i in [0...@box_div.length]

      if not @box_div[i].style?
        @box_div[i].appendTo(@plot_view.$el.find('div.bk-canvas-overlays')).hide()

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

    if @visuals.fill.doit
      for i in [0...@box_div.length]
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fillRect(sleft[i], stop[i], sright[i]-sleft[i], sbottom[i]-stop[i])

    if @visuals.line.doit
      ctx.beginPath()
      for i in [0...@box_div.length]
        @visuals.line.set_vectorize(ctx, i)
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
      source:       [ p.Instance                ]
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
    @set({left: left, right: right, top: top, bottom: bottom}, {silent: @get('silent_update')})
    if @get('silent_update')
      @trigger('coords_update')

module.exports =
  Model: BoxAnnotation
  View: BoxAnnotationView
