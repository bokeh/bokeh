_ = require "underscore"

Annotation = require "./annotation"
ColumnDataSource = require "../sources/column_data_source"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class SpanView extends Renderer.View

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
    if @span_div?.length != @location.length
      @span_div = (@$el.clone().addClass('spanning') for i in @location)

  _reset_coords: () ->
    @location = [@mget('location')]

  _vectorize: (prop) ->
    return (prop for i in @span_div)

  render: () ->
    if @mget('location') == null
      @span_div[0].hide()
      return null

    if @mget('dimension') == 'width'
      stop = @canvas.v_vy_to_sy(@_calc_dim(@location, @ymapper))
      sleft = @_vectorize(@canvas.vx_to_sx(@frame.get('left')))
      swidth = @_vectorize(@frame.get('width'))
      sheight = @_vectorize(@model.properties.line_width.value())
    else
      stop = @_vectorize(@canvas.vy_to_sy(@frame.get('top')))
      sleft = @canvas.v_vx_to_sx(@_calc_dim(@location, @xmapper))
      swidth = @_vectorize(@model.properties.line_width.value())
      sheight = @_vectorize(@frame.get('height'))

    if @mget('render_mode') == 'css'
      @_css_span(stop, sleft, swidth, sheight)
    else
      @_canvas_span(stop, sleft, swidth, sheight)

  _css_span: (stop, sleft, swidth, sheight) ->
    for i in [0...@span_div.length]

      if not @span_div[i].style?
        @span_div[i].appendTo(@plot_view.$el.find('div.bk-canvas-overlays')).hide()

      @span_div[i].css({
        "position": "absolute"
        "top": "#{stop[i]}px",
        "left": "#{sleft[i]}px",
        "width": "#{swidth[i]}px",
        "height": "#{sheight[i]}px"
        "z-index": 1000
        "background-color": "#{@line_color[i]}"
        "opacity": "#{@line_alpha[i]}"
        })
      @span_div[i].show()

  _canvas_span: (stop, sleft, swidth, sheight) ->
    ctx = @plot_view.canvas_view.ctx
    ctx.save()
    for i in [0...@span_div.length]
      ctx.beginPath()
      @visuals.line.set_vectorize(ctx, i)
      ctx.moveTo(sleft[i], stop[i])
      if @mget('dimension') == "width"
        ctx.lineTo(sleft[i] + swidth[i], stop[i])
      else
        ctx.lineTo(sleft[i], stop[i] + sheight[i])
      ctx.stroke()
    ctx.restore()

  _calc_dim: (location, mapper) ->
    vdim = []
    for loc in location
      if @mget('location_units') == 'data'
        vdim.push(mapper.map_to_target(loc))
      else
        vdim.push(loc)
      return vdim

class Span extends Annotation.Model
  default_view: SpanView

  type: 'Span'

  mixins: ['line']

  props: ->
    return _.extend {}, super(), {
      location:       [ p.NumberSpec,   null      ]
      render_mode:    [ p.RenderMode,   'canvas'  ]
      x_range_name:   [ p.String,       'default' ]
      y_range_name:   [ p.String,       'default' ]
      location_units: [ p.SpatialUnits, 'data'    ]
      dimension:      [ p.Dimension,    'width'   ]
      source:         [ p.Instance                ]
    }

  defaults: ->
    return _.extend {}, super(), {
      # overrides
      line_color: 'black'

      # internal
      silent_update: false
    }

  nonserializable_attribute_names: () ->
    super().concat(['silent_update'])

  update:({location}) ->
    @set({location: location}, {silent: @get('silent_update')})
    if @get('silent_update')
      @trigger('coords_update')

module.exports =
  Model: Span
  View: SpanView
