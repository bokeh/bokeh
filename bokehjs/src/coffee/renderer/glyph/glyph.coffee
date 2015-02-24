define [
  "underscore",
  "common/logging",
  "common/has_parent",
  "common/collection"
  "common/continuum_view",
  "renderer/properties"
], (_, Logging, HasParent, Collection, ContinuumView, properties) ->

  logger = Logging.logger

  class GlyphView extends ContinuumView

    initialize: (options) ->
      super(options)
      @renderer = options.renderer

      @glyph = new properties.Glyph(@, @_fields)
      @props = {}

      if 'line' in @_properties
        @props.line = new properties.Line(@)
      if 'fill' in @_properties
        @props.fill = new properties.Fill(@)
      if 'text' in @_properties
        @props.text = new properties.Text(@)

    render: (ctx, indicies) ->
      if @mget("visible")
        @_render(ctx, indicies)

    _map_data: () -> null

    update_data: (source) ->
      if @props.fill? and @props.fill.do_fill
        @props.fill.set_prop_cache(source)
      if @props.line? and @props.line.do_stroke
        @props.line.set_prop_cache(source)
      if @props.text?
        @props.text.set_prop_cache(source)

    set_data: (source) ->
      for field in @_fields
        # REMOVE {
        if field.indexOf(":") > -1
          [field, junk] = field.split(":")
        # }

        @[field] = @glyph.source_v_select(field, source)

        # special cases
        if field == "direction"
          values = new Uint8Array(@direction.length)
          for i in [0...@direction.length]
            dir = @direction[i]
            if      dir == 'clock'     then values[i] = false
            else if dir == 'anticlock' then values[i] = true
            else values = NaN
          @direction = values

        if field.indexOf("angle") > -1
          @[field] = (-x for x in @[field])

      @_set_data()

      # just use the length of the last added field
      [0...@[field].length]

    # any additional customization can happen here
    _set_data: () -> null

    distance_vector: (pt, span_prop_name, position, dilate=false) ->
      """ returns an array """
      pt_units = @glyph[pt].units
      span_units = @glyph[span_prop_name].units

      if      pt == 'x' then mapper = @renderer.xmapper
      else if pt == 'y' then mapper = @renderer.ymapper

      source = @renderer.mget('data_source')
      local_select = (prop_name) =>
        return @glyph.source_v_select(prop_name, source)
      span = local_select(span_prop_name)
      if span_units == 'screen'
        return span

      if position == 'center'
        halfspan = (d / 2 for d in span)
        ptc = local_select(pt)
        if pt_units == 'screen'
          ptc = mapper.v_map_from_target(ptc)
        if _.isString(ptc[0])
          ptc = mapper.v_map_to_target(ptc)
        pt0 = (ptc[i] - halfspan[i] for i in [0...ptc.length])
        pt1 = (ptc[i] + halfspan[i] for i in [0...ptc.length])
      else
        pt0 = local_select(pt)
        if pt_units == 'screen'
          pt0 = mapper.v_map_from_target(pt0)
        pt1 = (pt0[i] + span[i] for i in [0...pt0.length])

      spt0 = mapper.v_map_to_target(pt0)
      spt1 = mapper.v_map_to_target(pt1)

      if dilate
        return (Math.ceil(Math.abs(spt1[i] - spt0[i])) for i in [0...spt0.length])
      else
        return (Math.abs(spt1[i] - spt0[i]) for i in [0...spt0.length])

    hit_test: (geometry) ->
      result = null

      if geometry.type == "point"
        if @_hit_point?
          result = @_hit_point(geometry)
        else if not @_point_hit_warned?
          type = @model.type
          logger.warn("'point' selection not available on #{type} renderer")
          @_point_hit_warned = true
      else if geometry.type == "rect"
        if @_hit_rect?
          result = @_hit_rect(geometry)
        else if not @_rect_hit_warned?
          type = @model.type
          logger.warn("'rect' selection not available on #{type} renderer")
          @_rect_hit_warned = true
      else if geometry.type == "poly"
        if @_hit_poly?
          result = @_hit_poly(geometry)
        else if not @_poly_hit_warned?
          type = @model.type
          logger.warn("'poly' selection not available on #{type} renderer")
          @_poly_hit_warned = true
      else
        logger.error("unrecognized selection geometry type '#{ geometry.type }'")

      return result

    get_reference_point: () ->
      reference_point = @mget('reference_point')
      if _.isNumber(reference_point)
        return @data[reference_point]
      else
        return reference_point

    draw_legend: (ctx, x0, x1, y0, y1) -> null

    _generic_line_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x0, (y0 + y1) /2)
      ctx.lineTo(x1, (y0 + y1) /2)
      if @props.line.do_stroke
        @props.line.set_vectorize(ctx, reference_point)
        ctx.stroke()
      ctx.restore()

    _generic_area_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0
      indices = [reference_point]

      w = Math.abs(x1-x0)
      dw = w*0.1
      h = Math.abs(y1-y0)
      dh = h*0.1

      sx0 = x0 + dw
      sx1 = x1 - dw

      sy0 = y0 + dh
      sy1 = y1 - dh

      if @props.fill.do_fill
        @props.fill.set_vectorize(ctx, reference_point)
        ctx.fillRect(sx0, sy0, sx1-sx0, sy1-sy0)

      if @props.line.do_stroke
        ctx.beginPath()
        ctx.rect(sx0, sy0, sx1-sx0, sy1-sy0)
        @props.line.set_vectorize(ctx, reference_point)
        ctx.stroke()

  class Glyph extends HasParent

    fill_defaults: {
      fill_color: 'gray'
      fill_alpha: 1.0
    }

    line_defaults: {
      line_color: 'black'
      line_width: 1
      line_alpha: 1.0
      line_join: 'miter'
      line_cap: 'butt'
      line_dash: []
      line_dash_offset: 0
    }

    defaults: ->
      return _.extend {
        visible: true
      }

  class Glyphs extends Collection

  return {
    Model: Glyph
    View: GlyphView
    Collection: Glyphs
  }
