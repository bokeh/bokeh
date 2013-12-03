
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
      else
        @selection_glyphprops = @glyph_props

      if @mget('nonselection_glyphspec')
        spec = _.extend({}, @mget('glyphspec'), @mget('nonselection_glyphspec'))
        @nonselection_glyphprops = @init_glyph(spec)

    init_glyph: (glyphspec) ->
      props = {}
      if 'line' in @_properties
        props['line_properties'] = new Properties.line_properties(@, glyphspec)
      if 'fill' in @_properties
        props['fill_properties'] = new Properties.fill_properties(@, glyphspec)
      if 'text' in @_properties
        props['text_properties'] = new Properties.text_properties(@, glyphspec)
      glyph_props = new Properties.glyph_properties(@, glyphspec, @_fields, props)
      return glyph_props

    set_data: (request_render=true) ->
      source = @mget_obj('data_source')

      for field in @_fields
        if field.indexOf(":") > -1
          [field, junk] = field.split(":")
        @[field] = @glyph_props.source_v_select(field, source)

        # special cases
        if field == "direction"
          values = new Uint8Array(@direction.length)
          for i in [0..@direction.length-1]
            dir = @direction[i]
            if      dir == 'clock'     then values[i] = false
            else if dir == 'anticlock' then values[i] = true
            else values = NaN
          @direction = values

        if field.indexOf("angle") > -1
          @[field] = (-x for x in @[field])

      # any additional customization can happen here
      if @_set_data?
        @set_data()

      len = @[@_fields[0]].length

      @mask = new Uint8Array(len)
      @selected_mask = new Uint8Array(len)
      for i in [0..@mask.length-1]
        @mask[i] = true
        @selected_mask[i] = false

      @have_new_data = true

      if request_render
        @request_render()

    render: (have_new_mapper_state=true) ->
      if @need_set_data
        @set_data(false)
        @need_set_data = false

      if have_new_mapper_state or @have_new_data
        @_map_data()

      if @_mask_data?
        @_mask_data()

      ctx = @plot_view.ctx
      ctx.save()

      do_render = (ctx, glyph_props, use_selection) =>
        source = @mget_obj('data_source')

        if glyph_props.fill_properties? and glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_prop_cache(source)
        if glyph_props.line_properties? and glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_prop_cache(source)
        if glyph_props.text_properties?
          glyph_props.text_properties.set_prop_cache(source)

        @_render(ctx, glyph_props, use_selection)

      selected = @mget_obj('data_source').get('selected')

      for idx in selected
        @selected_mask[idx] = true

      if selected and selected.length and @nonselection_glyphprops
        do_render(ctx, @selection_glyphprops, true)
        do_render(ctx, @nonselection_glyphprops, false)
      else
        do_render(ctx, @glyph_props)

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
