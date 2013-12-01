
define [
  "underscore",
  "common/has_parent",
  "common/plot_widget",
  "renderer/properties"
], (_, HasParent, PlotWidget, Properties) ->

  class GlyphView extends PlotWidget

    initialize: (options) ->
      super(options)
      @need_set_data = true

      @glyph_props = @init_glyph(@mget('glyphspec'))
      if @mget('selection_glyphspec')
        spec = _.extend({}, @mget('glyphspec'), @mget('selection_glyphspec'))
        @selection_glyphprops = @init_glyph(spec)
      if @mget('nonselection_glyphspec')
        spec = _.extend({}, @mget('glyphspec'), @mget('nonselection_glyphspec'))
        @nonselection_glyphprops = @init_glyph(spec)
        #@nonselection_glyphprops.fill_properties.fill_alpha.value=.1
      if not @selection_glyphprops
        @selection_glyphprops = @glyph_props

      ##duped in many classes
      @do_fill   = @glyph_props.fill_properties.do_fill
      @do_stroke = @glyph_props.line_properties.do_stroke


    _base_glyphspec : ['x', 'y']
    init_glyph: (glyphspec) ->
      fill_props = new Properties.fill_properties(@, glyphspec)
      line_props = new Properties.line_properties(@, glyphspec)
      glyph_props = new Properties.glyph_properties(
        @,
        glyphspec,
        @_base_glyphspec,
        {
          fill_properties: new Properties.fill_properties(@, glyphspec),
          line_properties: new Properties.line_properties(@, glyphspec)
        }
      )
      return glyph_props

    _data_fields : []
    set_data_new: (request_render=true) ->
      source = @mget_obj('data_source')
      @x = @glyph_props.source_v_select('x', source)
      @y = @glyph_props.source_v_select('y', source)
      for field in @_data_fields
        @[field] = @glyph_props.source_v_select(field, source)
      @mask = new Uint8Array(@x.length)
      @selected_mask = new Uint8Array(@x.length)
      for i in [0..@mask.length-1]
        @mask[i] = true
        @selected_mask[i] = false
      @have_new_data = true

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

    _render : (plot_view, have_new_mapper_state) ->

      """ this method should be used tos etup any special render time
      variables for this particular glyph type, at the end, call
      _render_core

      """ #"
      
    _render_core: ->
      """ this logic doesn't seem to change between classes  """
      ctx = @plot_view.ctx
      ctx.save()
      selected = @mget_obj('data_source').get('selected')
      for idx in selected
        @selected_mask[idx] = true

      if selected and selected.length and @nonselection_glyphprops
        @_full_path(ctx, @selection_glyphprops, true)
        @_full_path(ctx, @nonselection_glyphprops, false)
      else
        @_full_path(ctx, @nonselection_glyphprops)
      ctx.restore()

    select: () ->
      'pass'

    xrange: () ->
      return @plot_view.x_range

    yrange: () ->
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

    distance_vector: (pt, span_prop_name, position) ->
      """ returns an array """ #"
      pt_units = @glyph_props[pt].units
      span_units = @glyph_props[span_prop_name].units

      if      pt == 'x' then mapper = @plot_view.xmapper
      else if pt == 'y' then mapper = @plot_view.ymapper

      source = @mget_obj('data_source')
      local_select = (prop_name) =>
        if source.type == 'ColumnDataSource'
          return @glyph_props.source_v_select(prop_name, source)
        else
          return @glyph_props.v_select(prop_name, @data2)
      span = local_select(span_prop_name)
      if span_units == 'screen'
        return span

      if position == 'center'
        halfspan = (d / 2 for d in span)
        ptc = local_select(pt)
        if pt_units == 'screen'
          ptc = mapper.v_map_from_target(ptc)
        pt0 = (ptc[i] - halfspan[i] for i in [0..ptc.length-1])
        pt1 = (ptc[i] + halfspan[i] for i in [0..ptc.length-1])

      else
        pt0 = local_select(pt)
        if pt_units == 'screen'
          pt0 = mapper.v_map_from_target(pt0)
        pt1 = (pt0[i] + span[i] for i in [0..pt0.length-1])

      spt0 = mapper.v_map_to_target(pt0)
      spt1 = mapper.v_map_to_target(pt1)

      return (spt1[i] - spt0[i] for i in [0..spt0.length-1])


    get_reference_point: () ->
      reference_point = @mget('reference_point')
      if _.isNumber(reference_point)
        return @data[reference_point]
      else
        return reference_point

    draw_legend: (ctx, x1, x2, y1, y2) ->

  class Glyph extends HasParent

    defaults: () ->
      return {
        data_source: null
      }

    display_defaults: () ->
      return {
        level: 'glyph'
        radius_units: 'screen'
        length_units: 'screen'
        angle_units: 'deg'
        start_angle_units: 'deg'
        end_angle_units: 'deg'
      }

  return {
    "Model": Glyph,
    "View": GlyphView
  }
