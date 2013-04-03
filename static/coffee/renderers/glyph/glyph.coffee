base = require('../../base')
Collections = base.Collections
HasParent = base.HasParent
safebind = base.safebind

PlotWidget = require('../../common/plot_widget').PlotWidget


class GlyphView extends PlotWidget

  initialize: (options) ->
    super(options)
    @need_set_data = true

  set_data: (request_render=true) ->
    source = @mget_obj('data_source')
    if source.type == 'ObjectArrayDataSource'
      data = source.get('data')
    else if source.type == 'ColumnDataSource'
      data = source.datapoints()
    else
      console.log('Unknown data source type: ' + source.type)

    @_set_data(data)
    if request_render
      @request_render()

  render: () ->
    if @need_set_data
      @set_data(false)
      @need_set_data = false
    @_render()

  bind_bokeh_events: () ->
    safebind(this, @model, 'change', @request_render)

  distance: (data, pt, span, position) ->
    pt_units = @glyph_props[pt].units
    span_units = @glyph_props[span].units

    if      pt == 'x' then mapper = @xmapper
    else if pt == 'y' then mapper = @ymapper

    span = (@glyph_props.select(span, x) for x in data)
    if span_units == 'screen'
      return span

    if position == 'center'
      halfspan = (d / 2 for d in span)
      ptc = (@glyph_props.select(pt, x) for x in data)
      if pt_units == 'screen'
        ptc = mapper.v_map_data(ptc)
      pt0 = (ptc[i] - halfspan[i] for i in [0..ptc.length-1])
      pt1 = (ptc[i] + halfspan[i] for i in [0..ptc.length-1])

    else
      pt0 = (@glyph_props.select(pt, x) for x in data)
      if pt_units == 'screen'
        pt0 = mapper.v_map_data(pt0)
      pt1 = (pt0[i] + span[i] for i in [0..pt0.length-1])

    spt0 = mapper.v_map_screen(pt0)
    spt1 = mapper.v_map_screen(pt1)

    return (spt1[i] - spt0[i] for i in [0..spt0.length-1])



class Glyph extends HasParent


Glyph::defaults = _.clone(Glyph::defaults)
_.extend(Glyph::defaults,
  data_source: null
)


Glyph::display_defaults = _.clone(Glyph::display_defaults)
_.extend(Glyph::display_defaults, {

  radius_units: 'screen'
  length_units: 'screen'
  angle_units: 'deg'
  start_angle_units: 'deg'
  end_angle_units: 'deg'

})


exports.GlyphView = GlyphView
exports.Glyph = Glyph
