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
    @listenTo(@model, 'data_update', @plot_view.request_render)

  set_data: () ->
    super(@mget('source'))
    @set_visuals(@mget('source'))

  render: () ->
    ctx = @plot_view.canvas_view.ctx

    for i in [0...@xs.length]

      if @xs[i].length != @ys[i].length
        return null

      if @xs[i].length < 3 or @ys[i].length < 3
        return null

      sx = @canvas.v_vx_to_sx(@_calc_dim('xs', @xmapper))
      sy = @canvas.v_vy_to_sy(@_calc_dim('ys', @ymapper))

      debugger;

      if i == 0
        ctx.beginPath()
        ctx.moveTo(sx, sy)
      else
        ctx.lineTo(sx, sy)

    ctx.closePath()

    if @visuals.line.doit
      @visuals.line.set_value(ctx)
      ctx.stroke()

    if @visuals.fill.doit
      @visuals.fill.set_value(ctx)
      ctx.fill()

  _calc_dim: (dim, mapper) ->
    vdim = []
    for value in dim
      if @mget(dim+'_units') == 'data'
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
      xs:           [ p.NumberSpec,   []        ]
      xs_units:     [ p.SpatialUnits, 'data'    ]
      ys:           [ p.NumberSpec,   []        ]
      ys_units:     [ p.SpatialUnits, 'data'    ]
      x_range_name: [ p.String,       'default' ]
      y_range_name: [ p.String,       'default' ]
      source:       [ p.instance                ]
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
    if @get('silent_update')
      @attributes['xs'] = xs
      @attributes['ys'] = ys
    else
      @set({xs: xs, ys: ys})
    @trigger('data_update')

module.exports =
  Model: PolyAnnotation
  View: PolyAnnotationView
