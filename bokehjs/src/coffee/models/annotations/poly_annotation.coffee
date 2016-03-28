_ = require "underscore"

Annotation = require "./annotation"
ColumnDataSource = require "../sources/column_data_source"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"

class PolyAnnotationView extends Renderer.View
  initialize: (options) ->
    super(options)
    if not @mget('source')?
      this.mset('source', new ColumnDataSource.Model())
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]
    @set_data()

  bind_bokeh_events: () ->
    @listenTo(@model, 'coords_update', () ->
      @_reset_coords()
      @plot_view.request_render())

    @listenTo(@model, 'change', () ->
      @set_data()
      @plot_view.request_render())

    @listenTo(@mget('source'), 'change', () ->
      @set_data()
      @plot_view.request_render())

  set_data: () ->
    super(@mget('source'))
    @set_visuals(@mget('source'))
    # handle case where single poly annotation is passed in
    if not _.isArray(@xs[0])
      @xs = [@xs]
      @ys = [@ys]

  _reset_coords: () ->
    if _.isArray(this.mget('source').get_column('xs')[0])
      @xs = this.mget('source').get_column('xs')
      @ys = this.mget('source').get_column('ys')
    else
      @xs = [this.mget('source').get_column('xs')]
      @ys = [this.mget('source').get_column('ys')]

  render: () ->
    ctx = @plot_view.canvas_view.ctx

    for i in [0...@xs.length]

      if @xs[i].length != @ys[i].length
        return null

      if @xs[i].length < 3 or @ys[i].length < 3
        return null

      sx = @canvas.v_vx_to_sx(@_calc_dim(@xs[i], @mget('xs_units'), @xmapper))
      sy = @canvas.v_vy_to_sy(@_calc_dim(@ys[i], @mget('ys_units'), @ymapper))

      ctx.beginPath()
      ctx.moveTo(sx[0], sy[0])

      for j in [1...sx.length]
        ctx.lineTo(sx[j], sy[j])

      ctx.closePath()

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

  _calc_dim: (dim, dim_units, mapper) ->
    vdim = []
    for value in dim
      if dim_units == 'data'
        vdim.push(mapper.map_to_target(value))
      else
        vdim.push(value)
    return vdim


class PolyAnnotation extends Annotation.Model
  default_view: PolyAnnotationView

  type: "PolyAnnotation"

  mixins: ['line', 'fill']

  props: ->
    return _.extend {}, super(), {
      xs:           [ p.NumberSpec,   null      ]
      xs_units:     [ p.SpatialUnits, 'data'    ]
      ys:           [ p.NumberSpec,   null      ]
      ys_units:     [ p.SpatialUnits, 'data'    ]
      x_range_name: [ p.String,       'default' ]
      y_range_name: [ p.String,       'default' ]
      source:       [ p.Instance                ]
    }

  defaults: () ->
    return _.extend({}, super(), {
      # overrides
      fill_color: "#fff9ba"
      fill_alpha: 0.4
      line_color: "#cccccc"
      line_alpha: 0.3
      line_alpha: 0.3

      # internal
      silent_update: false
    })

  nonserializable_attribute_names: () ->
    super().concat(['silent_update'])

  update:({xs, ys}) ->
    #need to set values on data_source not model to avoid validation error
    @get('source').set('data', {xs: xs, ys: ys}, {silent: @get('silent_update')})
    if @get('silent_update')
      @trigger('coords_update')

module.exports =
  Model: PolyAnnotation
  View: PolyAnnotationView
