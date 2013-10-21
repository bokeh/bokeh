base = require('../../base')
HasParent = base.HasParent
safebind = base.safebind

PlotWidget = require('../../common/plot_widget').PlotWidget


class GlyphView extends PlotWidget

  initialize: (options) ->
    super(options)
    @need_set_data = true

  set_data: (request_render=true) ->
    source = @mget_obj('data_source')
    #FIXME: should use some mechanism like isinstance
    if source.type == 'ObjectArrayDataSource'
      data = source.get('data')
    else if source.type == 'ColumnDataSource'
      data = source.datapoints()
    else if source.type == 'PandasPlotSource'
      data = source.datapoints()
    else
      console.log('Unknown data source type: ' + source.type)

    @_set_data(data)
    if request_render
      @request_render()

  render: (have_new_mapper_state=true) ->
    if @need_set_data
      @set_data(false)
      @need_set_data = false
    @_render(@plot_view, have_new_mapper_state)

  select : () ->
    'pass'

  xrange : () ->
    return @plot_view.x_range

  yrange : () ->
    return @plot_view.y_range

  bind_bokeh_events: () ->
    @listenTo(@model, 'change', @request_render)
    @listenTo(@mget_obj('data_source'), 'change', @set_data)

  distance: (data, pt, span, position) ->
    pt_units = @glyph_props[pt].units
    span_units = @glyph_props[span].units

    if      pt == 'x' then mapper = @plot_view.xmapper
    else if pt == 'y' then mapper = @plot_view.ymapper

    span = @glyph_props.v_select(span, data)
    if span_units == 'screen'
      return span

    if position == 'center'
      halfspan = (d / 2 for d in span)
      ptc = @glyph_props.v_select(pt, data)
      if pt_units == 'screen'
        ptc = mapper.v_map_from_target(ptc)
      pt0 = (ptc[i] - halfspan[i] for i in [0..ptc.length-1])
      pt1 = (ptc[i] + halfspan[i] for i in [0..ptc.length-1])

    else
      pt0 = @glyph_props.v_select(pt, data)
      if pt_units == 'screen'
        pt0 = mapper.v_map_from_target(pt0)
      pt1 = (pt0[i] + span[i] for i in [0..pt0.length-1])

    spt0 = mapper.v_map_to_target(pt0)
    spt1 = mapper.v_map_to_target(pt1)

    return (spt1[i] - spt0[i] for i in [0..spt0.length-1])

  get_reference_point : () ->
    reference_point = @mget('reference_point')
    if _.isNumber(reference_point)
      return @data[reference_point]
    else
      return reference_point
  draw_legend: (ctx, x1, x2, y1, y2) ->





class Glyph extends HasParent


Glyph::defaults = _.clone(Glyph::defaults)
_.extend(Glyph::defaults,
  data_source: null
)


Glyph::display_defaults = _.clone(Glyph::display_defaults)
_.extend(Glyph::display_defaults, {

  level: 'glyph'
  radius_units: 'screen'
  length_units: 'screen'
  angle_units: 'deg'
  start_angle_units: 'deg'
  end_angle_units: 'deg'

})


exports.GlyphView = GlyphView
exports.Glyph = Glyph
