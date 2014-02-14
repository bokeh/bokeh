
define [
  "underscore",
  "backbone",
  "common/safebind",
  "common/has_parent",
  "common/plot_widget",
  "renderer/properties",
], (_, Backbone, safebind, HasParent, PlotWidget, Properties) ->

  glyph_properties = Properties.glyph_properties
  line_properties  = Properties.line_properties
  text_properties  = Properties.text_properties

  signum = (x) -> x ? x<0 ? -1:1:0

  _angle_lookup = {
    top:
      parallel   : 0
      normal     : -Math.PI/2
      horizontal : 0
      vertical   : -Math.PI/2
    bottom:
      parallel   : 0
      normal     : Math.PI/2
      horizontal : 0
      vertical   : Math.PI/2
    left:
      parallel   : -Math.PI/2
      normal     : 0
      horizontal : 0
      vertical   : -Math.PI/2
    right:
      parallel   : Math.PI/2
      normal     : 0
      horizontal : 0
      vertical   : Math.PI/2
  }

  _baseline_lookup = {
    top:
      parallel   : 'alphabetic'
      normal     : 'middle'
      horizontal : 'alphabetic'
      vertical   : 'middle'
    bottom:
      parallel   : 'hanging'
      normal     : 'middle'
      horizontal : 'hanging'
      vertical   : 'middle'
    left:
      parallel   : 'alphabetic'
      normal     : 'middle'
      horizontal : 'middle'
      vertical   : 'alphabetic'
    right:
      parallel   : 'alphabetic'
      normal     : 'middle'
      horizontal : 'middle'
      vertical   : 'alphabetic'
  }

  _align_lookup = {
    top:
      parallel   : 'center'
      normal     : 'left'
      horizontal : 'center'
      vertical   : 'left'
    bottom:
      parallel   : 'center'
      normal     : 'left'
      horizontal : 'center'
      vertical   : 'right'
    left:
      parallel   : 'center'
      normal     : 'right'
      horizontal : 'right'
      vertical   : 'center'
    right:
      parallel   : 'center'
      normal     : 'left'
      horizontal : 'left'
      vertical   : 'center'
  }

  _align_lookup_negative = {
    top    : 'right'
    bottom : 'left'
    left   : 'right'
    right  : 'left'
  }

  _align_lookup_positive = {
    top    : 'left'
    bottom : 'right'
    left   : 'right'
    right  : 'left'
  }

  # lookup[axis][idir][jdir][loc]
  _normal_lookup = [
    {
      norm: {
        norm: {'min': +1, 'max': -1}
        flip: {'min': -1, 'max': +1}
      }
      flip: {
        norm: {'min': +1, 'max': -1}
        flip: {'min': -1, 'max': +1}
      }
    },
    {
      norm: {
        norm: {'min': -1, 'max': +1}
        flip: {'min': -1, 'max': +1}
      }
      flip: {
        norm: {'min': +1, 'max': -1}
        flip: {'min': +1, 'max': -1}
      }
    }
  ]

  class AxisView extends PlotWidget
    initialize: (options) ->
      super(options)

      @rule_props = new line_properties(@, null, 'axis_')
      @major_tick_props = new line_properties(@, null, 'major_tick_')
      @major_label_props = new text_properties(@, null, 'major_label_')
      @axis_label_props = new text_properties(@, null, 'axis_label_')

      @formatter = options.formatter

    render: () ->
      ctx = @plot_view.ctx

      ctx.save()

      @_draw_rule(ctx)
      @_draw_major_ticks(ctx)
      @_draw_major_labels(ctx)
      @_draw_axis_label(ctx)

      ctx.restore()

    bind_bokeh_events: () ->
      safebind(this, @model, 'change', @request_render)

    padding_request: () ->
      return @_padding_request()

    _draw_rule: (ctx) ->
      if not @rule_props.do_stroke
        return
      [x, y] = coords = @mget('rule_coords')
      [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data")
      [nx, ny] = @mget('normals')

      @rule_props.set(ctx, @)
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[0]), Math.round(sy[0]))
      for i in [1...sx.length]
        ctx.lineTo(Math.round(sx[i]), Math.round(sy[i]))
      ctx.stroke()

    _draw_major_ticks: (ctx) ->
      if not @major_tick_props.do_stroke
        return
      [x, y] = coords = @mget('major_coords')
      [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data")
      [nx, ny] = @mget('normals')

      tin = @mget('major_tick_in')
      tout = @mget('major_tick_out')
      @major_tick_props.set(ctx, @)
      for i in [0...sx.length]
        ctx.beginPath()
        ctx.moveTo(Math.round(sx[i]+nx*tout), Math.round(sy[i]+ny*tout))
        ctx.lineTo(Math.round(sx[i]-nx*tin),  Math.round(sy[i]-ny*tin))
        ctx.stroke()

    _draw_major_labels: (ctx) ->
      [x, y] = coords = @mget('major_coords')
      [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data")
      [nx, ny] = @mget('normals')
      dim = @mget('dimension')
      side = @mget('side')
      orient = @mget('major_label_orientation')

      if _.isString(orient)
        angle = _angle_lookup[side][orient]
      else
        angle = -orient
      standoff = @_tick_extent() + @mget('major_label_standoff')

      labels = @formatter.format(coords[dim])

      # override baseline and alignment with heuristics for tick labels
      @major_label_props.set(ctx, @)
      @_apply_location_heuristics(ctx, side, orient)

      for i in [0...sx.length]
        if angle
          ctx.translate(sx[i]+nx*standoff, sy[i]+ny*standoff)
          ctx.rotate(angle)
          ctx.fillText(labels[i], 0, 0)
          ctx.rotate(-angle)
          ctx.translate(-sx[i]-nx*standoff, -sy[i]-ny*standoff)
        else
          ctx.fillText(labels[i], Math.round(sx[i] + nx*standoff), Math.round(sy[i] + ny*standoff))

    _draw_axis_label: (ctx) ->
      label = @mget('axis_label')

      if not label?
        return

      [x, y] = @mget('rule_coords')
      [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data")
      [nx, ny] = @mget('normals')
      side = @mget('side')
      orient = 'parallel'

      angle = _angle_lookup[side][orient]
      standoff = @_tick_extent() + @_tick_label_extent() + @mget('axis_label_standoff')

      sx = (sx[0] + sx[sx.length-1])/2
      sy = (sy[0] + sy[sy.length-1])/2

      # override baseline and alignment with heuristics for axis labels
      @axis_label_props.set(ctx, @)
      @_apply_location_heuristics(ctx, side, orient)

      if angle
        ctx.translate(sx+nx*standoff, sy+ny*standoff)
        ctx.rotate(angle)
        ctx.fillText(label, 0, 0)
        ctx.rotate(-angle)
        ctx.translate(-sx-nx*standoff, -sy-ny*standoff)
      else
        ctx.fillText(label, sx+nx*standoff, sy+ny*standoff)

    _apply_location_heuristics: (ctx, side, orient) ->
      if _.isString(orient)
        baseline = _baseline_lookup[side][orient]
        align = _align_lookup[side][orient]

      else if orient == 0
        baseline = _baseline_lookup[side][orient]
        align = _align_lookup[side][orient]

      else if orient < 0
        baseline = 'middle'
        align = _align_lookup_negative[side]

      else if orient > 0
        baseline = 'middle'
        align = _align_lookup_positive[side]

      ctx.textBaseline = baseline
      ctx.textAlign = align

    _tick_extent: () ->
      return @mget('major_tick_out')

    _tick_label_extent: () ->
      extent = 0
      dim = @mget('dimension')

      coords = @mget('major_coords')
      side = @mget('side')
      orient = @mget('major_label_orientation')

      labels = @formatter.format(coords[dim])

      @major_label_props.set(@plot_view.ctx, @)

      if _.isString(orient)
        factor = 1
        angle = _angle_lookup[side][orient]
      else
        factor = 2
        angle = -orient
      angle = Math.abs(angle)
      c = Math.cos(angle)
      s = Math.sin(angle)

      if side == "top" or side == "bottom"
        for i in [0...labels.length]
          if not labels[i]?
            continue
          w = @plot_view.ctx.measureText(labels[i]).width * 1.1
          h = @plot_view.ctx.measureText(labels[i]).ascent * 0.9
          val = w*s + (h/factor)*c
          if val > extent
            extent = val
      else
        for i in [0...labels.length]
          if not labels[i]?
            continue
          w = @plot_view.ctx.measureText(labels[i]).width * 1.1
          h = @plot_view.ctx.measureText(labels[i]).ascent * 0.9
          val = w*c + (h/factor)*s
          if val > extent
            extent = val

      if extent > 0
        extent += @mget('major_label_standoff')

      return extent

    _axis_label_extent: () ->
      extent = 0

      side = @mget('side')
      orient = 'parallel'

      @major_label_props.set(@plot_view.ctx, @)

      angle = Math.abs(_angle_lookup[side][orient])
      c = Math.cos(angle)
      s = Math.sin(angle)

      if @mget('axis_label')
        extent += @mget('axis_label_standoff')
        @axis_label_props.set(@plot_view.ctx, @)
        w = @plot_view.ctx.measureText(@mget('axis_label')).width * 1.1
        h = @plot_view.ctx.measureText(@mget('axis_label')).ascent * 0.9
        if side == "top" or side == "bottom"
          extent += w*s + h*c
        else
          extent += w*c + h*s

      return extent

    _padding_request: () ->
      req = {}

      side = @mget('side')
      loc = @mget('location') ? 'min'

      if not _.isString(loc)
        return req

      padding = 0
      padding += @_tick_extent()
      padding += @_tick_label_extent()
      padding += @_axis_label_extent()

      req[side] = padding

      return req

  class Axis extends HasParent
    default_view: AxisView
    type: 'Axis'

    initialize: (attrs, options)->
      super(attrs, options)

      @scale = options.scale

      @register_property('computed_bounds', @_bounds, false)
      @add_dependencies('computed_bounds', this, ['bounds'])

      @register_property('rule_coords', @_rule_coords, false)
      @add_dependencies('rule_coords', this, ['computed_bounds', 'dimension', 'location'])

      @register_property('major_coords', @_major_coords, false)
      @add_dependencies('major_coords', this, ['computed_bounds', 'dimension', 'location'])

      @register_property('normals', @_normals, true)
      @add_dependencies('normals', this, ['computed_bounds', 'dimension', 'location'])

      @register_property('side', @_side, false)
      @add_dependencies('side', this, ['normals'])

      @register_property('padding_request', @_padding_request, false)

    dinitialize: (attrs, options)->
      @add_dependencies('computed_bounds', @get_obj('plot'), ['x_range', 'y_range'])

    _bounds: () ->
      i = @get('dimension')
      j = (i + 1) % 2

      ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]

      user_bounds = @get('bounds') ? 'auto'
      range_bounds = [ranges[i].get('min'), ranges[i].get('max')]

      if _.isArray(user_bounds)
        if Math.abs(user_bounds[0]-user_bounds[1]) > Math.abs(range_bounds[0]-range_bounds[1])
          start = Math.max(Math.min(user_bounds[0], user_bounds[1]), range_bounds[0])
          end = Math.min(Math.max(user_bounds[0], user_bounds[1]), range_bounds[1])
        else
          start = Math.min(user_bounds[0], user_bounds[1])
          end = Math.max(user_bounds[0], user_bounds[1])
      else
        [start, end] = range_bounds

      return [start, end]

    _rule_coords: () ->
      i = @get('dimension')
      j = (i + 1) % 2

      ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]
      range = ranges[i]
      cross_range = ranges[j]

      [start, end] = @get('computed_bounds')

      xs = new Array(2)
      ys = new Array(2)
      coords = [xs, ys]

      cstart = cross_range.get('start')
      cend = cross_range.get('end')

      loc = @get('location') ? 'min'
      if _.isString(loc)
        if loc == 'left' or loc == 'bottom'
          if cstart < cend
            loc = 'start'
          else
            loc = 'end'
        else if loc == 'right' or loc == 'top'
          if cstart < cend
            loc = 'end'
          else
            loc = 'start'
        loc = cross_range.get(loc)

      coords[i][0] = Math.max(start, range.get('min'))
      coords[i][1] = Math.min(end, range.get('max'))
      if coords[i][0] > coords[i][1]
        coords[i][0] = coords[i][1] = NaN

      coords[j][0] = loc
      coords[j][1] = loc

      return coords

    _major_coords: () ->
      i = @get('dimension')
      j = (i + 1) % 2

      ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]
      range = ranges[i]
      cross_range = ranges[j]

      [start, end] = @get('computed_bounds')

      # TODO, some axes need to pass range
      ticks = @scale.get_ticks(start, end, range, {})

      cstart = cross_range.get('start')
      cend = cross_range.get('end')

      loc = @get('location') ? 'min'
      if _.isString(loc)
        if loc == 'left' or loc == 'bottom'
          if cstart < cend
            loc = 'start'
          else
            loc = 'end'
        else if loc == 'right' or loc == 'top'
          if cstart < cend
            loc = 'end'
          else
            loc = 'start'
        loc = cross_range.get(loc)

      xs = []
      ys = []
      coords = [xs, ys]

      if range.type == "FactorRange"
        for ii in [0...ticks.length]
          coords[i].push(ticks[ii])
          coords[j].push(loc)
      else
        [range_min, range_max] = [range.get('min'), range.get('max')]

        for ii in [0...ticks.length]
          if ticks[ii] < range_min or ticks[ii] > range_max
            continue
          coords[i].push(ticks[ii])
          coords[j].push(loc)

      return coords

    _normals: () ->
      i = @get('dimension')
      j = (i + 1) % 2

      ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]
      range = ranges[i]
      cross_range = ranges[j]

      [start, end] = @get('computed_bounds')

      cstart = cross_range.get('start')
      cend = cross_range.get('end')

      loc = @get('location') ? 'min'

      normals = [0, 0]

      if _.isString(loc)
        if start > end
          idir = "flip"
        else
          idir = "norm"

        if cstart > cend
          jdir = "flip"
          if loc in ["left", "bottom"]
            loc = "max"
          else if loc in ["top", "right"]
            loc = "max"
        else
          jdir = "norm"
          if loc in ["left", "bottom"]
            loc = "min"
          else if loc in ["top", "right"]
            loc = "max"

        normals[j] = _normal_lookup[i][idir][jdir][loc]

      else
        if i == 0
          if Math.abs(loc-cstart) <= Math.abs(loc-cend)
            normals[j] = 1
          else
            normals[j] = -1
        else
          if Math.abs(loc-cstart) <= Math.abs(loc-cend)
            normals[j] = -1
          else
            normals[j] = 1

      return normals

    _side: () ->
      n = @get('normals')
      if n[1] == -1
        side = 'top'
      else if n[1] == 1
        side = 'bottom'
      else if n[0] == -1
        side = 'left'
      else if n[0] == 1
        side = 'right'
      return side

    display_defaults: () ->
      return {
        level: 'overlay'
        axis_line_color: 'black'
        axis_line_width: 1
        axis_line_alpha: 1.0
        axis_line_join: 'miter'
        axis_line_cap: 'butt'
        axis_line_dash: []
        axis_line_dash_offset: 0
        major_tick_in: 2
        major_tick_out: 6
        major_tick_line_color: 'black'
        major_tick_line_width: 1
        major_tick_line_alpha: 1.0
        major_tick_line_join: 'miter'
        major_tick_line_cap: 'butt'
        major_tick_line_dash: []
        major_tick_line_dash_offset: 0
        major_label_standoff: 5
        major_label_orientation: "horizontal"
        major_label_text_font: "helvetica"
        major_label_text_font_size: "10pt"
        major_label_text_font_style: "normal"
        major_label_text_color: "#444444"
        major_label_text_alpha: 1.0
        major_label_text_align: "center"
        major_label_text_baseline: "alphabetic"
        axis_label: ""
        axis_label_standoff: 5
        axis_label_text_font: "helvetica"
        axis_label_text_font_size: "16pt"
        axis_label_text_font_style: "normal"
        axis_label_text_color: "#444444"
        axis_label_text_alpha: 1.0
        axis_label_text_align: "center"
        axis_label_text_baseline: "alphabetic"
      }

  return {
    "Model": Axis,
    "View": AxisView
  }
