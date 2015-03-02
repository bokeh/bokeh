
define [
  "underscore"
  "kiwi"
  "common/has_parent"
  "common/layout_box"
  "common/logging"
  "common/plot_widget"
  "renderer/properties"
], (_, kiwi, HasParent, LayoutBox, Logging, PlotWidget, properties) ->

  logger = Logging.logger

  # This table lays out the rules for configuring the baseline, alignment, etc. of
  # axis title text, based on it's location and orientation
  #
  # side    orient        baseline   align     angle   normal-dist
  # -------------------------------------------------------------------------------
  # above   parallel      bottom     center    0       height
  #         normal        middle     left      -90     width
  #         horizontal    bottom     center    0       height
  #         [angle > 0]   middle     left              width * sin + height * cos
  #         [angle < 0]   middle     right             width * sin + height * cos
  #
  # below   parallel      top        center    0       height
  #         normal        middle     right     90      width
  #         horizontal    top        center    0       height
  #         [angle > 0]   middle     right             width * sin + height * cos
  #         [angle < 0]   middle     left              width * sin + height * cos
  #
  # left    parallel      bottom     center    90      height
  #         normal        middle     right     0       width
  #         horizontal    middle     right     0       width
  #         [angle > 0]   middle     right             width * cos + height * sin
  #         [angle < 0]   middle     right             width * cos + height + sin
  #
  # right   parallel      bottom     center   -90      height
  #         normal        middle     left     0        width
  #         horizontal    middle     left     0        width
  #         [angle > 0]   middle     left              width * cos + height * sin
  #         [angle < 0]   middle     left              width * cos + height + sin

  pi2 = Math.PI/2
  ALPHABETIC = 'alphabetic'
  MIDDLE = 'middle'
  HANGING = 'hanging'
  LEFT = 'left'
  RIGHT = 'right'
  CENTER = 'center'


  _angle_lookup = {
    above:
      parallel   : 0
      normal     : -pi2
      horizontal : 0
      vertical   : -pi2
    below:
      parallel   : 0
      normal     : pi2
      horizontal : 0
      vertical   : pi2
    left:
      parallel   : -pi2
      normal     : 0
      horizontal : 0
      vertical   : -pi2
    right:
      parallel   : pi2
      normal     : 0
      horizontal : 0
      vertical   : pi2
  }

  _baseline_lookup = {
    above:
      parallel   : ALPHABETIC
      normal     : MIDDLE
      horizontal : ALPHABETIC
      vertical   : MIDDLE
    below:
      parallel   : HANGING
      normal     : MIDDLE
      horizontal : HANGING
      vertical   : MIDDLE
    left:
      parallel   : ALPHABETIC
      normal     : MIDDLE
      horizontal : MIDDLE
      vertical   : ALPHABETIC
    right:
      parallel   : ALPHABETIC
      normal     : MIDDLE
      horizontal : MIDDLE
      vertical   : ALPHABETIC
  }

  _align_lookup = {
    above:
      parallel   : CENTER
      normal     : LEFT
      horizontal : CENTER
      vertical   : LEFT
    below:
      parallel   : CENTER
      normal     : LEFT
      horizontal : CENTER
      vertical   : RIGHT
    left:
      parallel   : CENTER
      normal     : RIGHT
      horizontal : RIGHT
      vertical   : CENTER
    right:
      parallel   : CENTER
      normal     : LEFT
      horizontal : LEFT
      vertical   : CENTER
  }

  _align_lookup_negative = {
    above  : RIGHT
    below  : LEFT
    left   : RIGHT
    right  : LEFT
  }

  _align_lookup_positive = {
    above  : LEFT
    below  : RIGHT
    left   : RIGHT
    right  : LEFT
  }

  _apply_location_heuristics = (ctx, side, orient) ->
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

  class AxisView extends PlotWidget
    initialize: (options) ->
      super(options)
      @rule_props = new properties.Line(@, 'axis_')
      @major_tick_props = new properties.Line(@, 'major_tick_')
      @minor_tick_props = new properties.Line(@, 'minor_tick_')
      @major_label_props = new properties.Text(@, 'major_label_')
      @axis_label_props = new properties.Text(@, 'axis_label_')
      @x_range_name = @mget('x_range_name')
      @y_range_name = @mget('y_range_name')

    render: () ->
      if not @mget('visible')
        return

      ctx = @plot_view.canvas_view.ctx

      ctx.save()

      @_draw_rule(ctx)
      @_draw_major_ticks(ctx)
      @_draw_minor_ticks(ctx)
      @_draw_major_labels(ctx)
      @_draw_axis_label(ctx)

      ctx.restore()

    bind_bokeh_events: () ->
      @listenTo(@model, 'change', @plot_view.request_render)

    _draw_rule: (ctx) ->
      if not @rule_props.do_stroke
        return
      [x, y] = coords = @mget('rule_coords')
      [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data", @x_range_name, @y_range_name)
      [nx, ny] = @mget('normals')
      [xoff, yoff]  = @mget('offsets')

      @rule_props.set(ctx, @)
      ctx.beginPath()
      ctx.moveTo(Math.round(sx[0]+nx*xoff), Math.round(sy[0]+ny*yoff))
      for i in [1...sx.length]
        ctx.lineTo(Math.round(sx[i]+nx*xoff), Math.round(sy[i]+ny*yoff))
      ctx.stroke()

    _draw_major_ticks: (ctx) ->
      if not @major_tick_props.do_stroke
        return
      coords = @mget('tick_coords')
      [x, y] = coords.major
      [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data", @x_range_name, @y_range_name)
      [nx, ny] = @mget('normals')
      [xoff, yoff]  = @mget('offsets')

      tin = @mget('major_tick_in')
      tout = @mget('major_tick_out')
      @major_tick_props.set(ctx, @)
      for i in [0...sx.length]
        ctx.beginPath()
        ctx.moveTo(Math.round(sx[i]+nx*tout+nx*xoff), Math.round(sy[i]+ny*tout+ny*yoff))
        ctx.lineTo(Math.round(sx[i]-nx*tin+nx*xoff),  Math.round(sy[i]-ny*tin+ny*yoff))
        ctx.stroke()

    _draw_minor_ticks: (ctx) ->
      if not @minor_tick_props.do_stroke
        return
      coords = @mget('tick_coords')
      [x, y] = coords.minor
      [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data", @x_range_name, @y_range_name)
      [nx, ny] = @mget('normals')
      [xoff, yoff]  = @mget('offsets')

      tin = @mget('minor_tick_in')
      tout = @mget('minor_tick_out')
      @minor_tick_props.set(ctx, @)
      for i in [0...sx.length]
        ctx.beginPath()
        ctx.moveTo(Math.round(sx[i]+nx*tout+nx*xoff), Math.round(sy[i]+ny*tout+ny*yoff))
        ctx.lineTo(Math.round(sx[i]-nx*tin+nx*xoff),  Math.round(sy[i]-ny*tin+ny*yoff))
        ctx.stroke()

    _draw_major_labels: (ctx) ->
      coords = @mget('tick_coords')
      [x, y] = coords.major
      [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data", @x_range_name, @y_range_name)
      [nx, ny] = @mget('normals')
      [xoff, yoff]  = @mget('offsets')
      dim = @mget('dimension')
      side = @mget('location')
      orient = @mget('major_label_orientation')

      if _.isString(orient)
        angle = _angle_lookup[side][orient]
      else
        angle = -orient
      standoff = @model._tick_extent(@) + @mget('major_label_standoff')

      labels = @mget('formatter').format(coords.major[dim])

      @major_label_props.set(ctx, @)
      _apply_location_heuristics(ctx, side, orient)

      for i in [0...sx.length]
        if angle
          ctx.translate(sx[i]+nx*standoff+nx*xoff, sy[i]+ny*standoff+ny*yoff)
          ctx.rotate(angle)
          ctx.fillText(labels[i], 0, 0)
          ctx.rotate(-angle)
          ctx.translate(-sx[i]-nx*standoff+nx*xoff, -sy[i]-ny*standoff+ny*yoff)
        else
          ctx.fillText(labels[i], Math.round(sx[i]+nx*standoff+nx*xoff), Math.round(sy[i]+ny*standoff+ny*yoff))

    _draw_axis_label: (ctx) ->
      label = @mget('axis_label')

      if not label?
        return

      [x, y] = @mget('rule_coords')
      [sx, sy] = @plot_view.map_to_screen(x, "data", y, "data", @x_range_name, @y_range_name)
      [nx, ny] = @mget('normals')
      [xoff, yoff]  = @mget('offsets')
      side = @mget('location')
      orient = 'parallel'

      angle = _angle_lookup[side][orient]
      standoff = @model._tick_extent(@) + @model._tick_label_extent(@) + @mget('axis_label_standoff')

      sx = (sx[0] + sx[sx.length-1])/2
      sy = (sy[0] + sy[sy.length-1])/2

      @axis_label_props.set(ctx, @)
      _apply_location_heuristics(ctx, side, orient)

      if angle
        ctx.translate(sx+nx*standoff+nx*xoff, sy+ny*standoff+ny*yoff)
        ctx.rotate(angle)
        ctx.fillText(label, 0, 0)
        ctx.rotate(-angle)
        ctx.translate(-sx-nx*standoff+nx*xoff, -sy-ny*standoff+ny*yoff)
      else
        ctx.fillText(label, sx+nx*standoff+nx*xoff, sy+ny*standoff+ny*yoff)

  class Axis extends HasParent
    default_view: AxisView
    type: 'Axis'

    initialize: (attrs, options)->
      super(attrs, options)

      @register_property('computed_bounds', @_computed_bounds, false)
      @add_dependencies('computed_bounds', this, ['bounds'])
      @add_dependencies('computed_bounds', @get('plot'), ['x_range', 'y_range'])

      @register_property('rule_coords', @_rule_coords, false)
      @add_dependencies('rule_coords', this, ['computed_bounds', 'side'])

      @register_property('tick_coords', @_tick_coords, false)
      @add_dependencies('tick_coords', this, ['computed_bounds', 'location'])

      @register_property('ranges', @_ranges, true)
      @register_property('normals', (() -> @_normals), true)
      @register_property('dimension', (() -> @_dim), true)
      @register_property('offsets', @_offsets, true)

    initialize_layout: (solver) ->
      panel = new LayoutBox.Model({solver: solver})
      @panel = panel

      # Yuck. The issues is that frames and canvases *are* panels, but axes are not but
      # should be (no multiple inheritnce in CoffeeScript)
      @_top = panel._top
      @_bottom = panel._bottom
      @_left = panel._left
      @_right = panel._right
      @_width = panel._width
      @_height = panel._height

      side = @get('location')
      if side == "above"
        @_dim = 0
        @_normals = [0, -1]
        @_size = panel._height
        @_anchor = panel._bottom
      else if side == "below"
        @_dim = 0
        @_normals = [0, 1]
        @_size = panel._height
        @_anchor = panel._top
      else if side == "left"
        @_dim = 1
        @_normals = [-1, 0]
        @_size = panel._width
        @_anchor = panel._right
      else if side == "right"
        @_dim = 1
        @_normals = [1, 0]
        @_size = panel._width
        @_anchor = panel._left
      else
        logger.error("unrecognized side: '#{ side }'")

    update_layout: (view, solver) ->
      if not @get('visible')
        size = 0
      else
        size = @_tick_extent(view) + @_tick_label_extent(view) + @_axis_label_extent(view)
      if not @_last_size?
        @_last_size = -1
      if size == @_last_size
        return
      @_last_size = size
      if @_size_constraint?
        solver.remove_constraint(@_size_constraint)
      @_size_constraint = new kiwi.Constraint(new kiwi.Expression(@_size, -size), kiwi.Operator.Eq)
      solver.add_constraint(@_size_constraint)

    _offsets: () ->
      side = @get('location')
      [xoff, yoff] = [0, 0]
      frame = @get('plot').get('frame')

      if side == "below"
        yoff = Math.abs(@panel.get("top") - frame.get("bottom"))

      else if side == "above"
        yoff = Math.abs(@panel.get("bottom") - frame.get("top"))

      else if side == "right"
        xoff = Math.abs(@panel.get("left") - frame.get("right"))

      else if side == "left"
        xoff = Math.abs(@panel.get("right") - frame.get("left"))

      return [xoff, yoff]

    _ranges: () ->
      i = @get('dimension')
      j = (i + 1) % 2
      frame = @get('plot').get('frame')
      ranges = [
        frame.get('x_ranges')[@get('x_range_name')],
        frame.get('y_ranges')[@get('y_range_name')]
      ]
      return [ranges[i], ranges[j]]

    _computed_bounds: () ->
      [range, cross_range] = @get('ranges')

      user_bounds = @get('bounds') ? 'auto'
      range_bounds = [range.get('min'), range.get('max')]

      if user_bounds == 'auto'
        return range_bounds

      if _.isArray(user_bounds)
        if Math.abs(user_bounds[0]-user_bounds[1]) > Math.abs(range_bounds[0]-range_bounds[1])
          start = Math.max(Math.min(user_bounds[0], user_bounds[1]), range_bounds[0])
          end = Math.min(Math.max(user_bounds[0], user_bounds[1]), range_bounds[1])
        else
          start = Math.min(user_bounds[0], user_bounds[1])
          end = Math.max(user_bounds[0], user_bounds[1])
        return [start, end]

      logger.error("user bounds '#{ user_bounds }' not understood")
      return null

    _rule_coords: () ->
      i = @get('dimension')
      j = (i + 1) % 2
      [range, cross_range] = @get('ranges')
      [start, end] = @get('computed_bounds')

      xs = new Array(2)
      ys = new Array(2)
      coords = [xs, ys]

      loc = @_get_loc(cross_range)

      coords[i][0] = Math.max(start, range.get('min'))
      coords[i][1] = Math.min(end, range.get('max'))
      if coords[i][0] > coords[i][1]
        coords[i][0] = coords[i][1] = NaN

      coords[j][0] = loc
      coords[j][1] = loc

      return coords

    _tick_coords: () ->
      i = @get('dimension')
      j = (i + 1) % 2
      [range, cross_range] = @get('ranges')
      [start, end] = @get('computed_bounds')

      ticks = @get('ticker').get_ticks(start, end, range, {})
      majors = ticks.major
      minors = ticks.minor

      loc = @_get_loc(cross_range)

      xs = []
      ys = []
      coords = [xs, ys]

      minor_xs = []
      minor_ys = []
      minor_coords = [minor_xs, minor_ys]

      if range.type == "FactorRange"
        for ii in [0...majors.length]
          coords[i].push(majors[ii])
          coords[j].push(loc)
      else
        [range_min, range_max] = [range.get('min'), range.get('max')]

        for ii in [0...majors.length]
          if majors[ii] < range_min or majors[ii] > range_max
            continue
          coords[i].push(majors[ii])
          coords[j].push(loc)

        for ii in [0...minors.length]
          if minors[ii] < range_min or minors[ii] > range_max
            continue
          minor_coords[i].push(minors[ii])
          minor_coords[j].push(loc)

      return {
        "major": coords,
        "minor": minor_coords
      }

    _get_loc: (cross_range) ->
      cstart = cross_range.get('start')
      cend = cross_range.get('end')
      side = @get('location')

      if side == 'left' or side == 'below'
        loc = 'start'
      else if side == 'right' or side == 'above'
        loc = 'end'

      return cross_range.get(loc)

    _tick_extent: (view) ->
      return @get('major_tick_out')

    _tick_label_extent: (view) ->
      extent = 0
      dim = @get('dimension')
      ctx = view.plot_view.canvas_view.ctx

      coords = @get('tick_coords').major
      side = @get('location')
      orient = @get('major_label_orientation')

      labels = @get('formatter').format(coords[dim])

      view.major_label_props.set(ctx, view)

      if _.isString(orient)
        hscale = 1
        angle = _angle_lookup[side][orient]
      else
        hscale = 2
        angle = -orient
      angle = Math.abs(angle)
      c = Math.cos(angle)
      s = Math.sin(angle)

      if side == "above" or side == "below"
        wfactor = s
        hfactor = c
      else
        wfactor = c
        hfactor = s

      for i in [0...labels.length]
        if not labels[i]?
          continue
        w = ctx.measureText(labels[i]).width * 1.1
        h = ctx.measureText(labels[i]).ascent * 0.9
        val = w*wfactor + (h/hscale)*hfactor
        if val > extent
          extent = val

      if extent > 0
        extent += @get('major_label_standoff')

      return extent

    _axis_label_extent: (view) ->
      extent = 0

      side = @get('location')
      orient = 'parallel'
      ctx = view.plot_view.canvas_view.ctx

      view.axis_label_props.set(ctx, view)

      angle = Math.abs(_angle_lookup[side][orient])
      c = Math.cos(angle)
      s = Math.sin(angle)

      if @get('axis_label')
        extent += @get('axis_label_standoff')
        view.axis_label_props.set(ctx, view)
        w = ctx.measureText(@get('axis_label')).width * 1.1
        h = ctx.measureText(@get('axis_label')).ascent * 0.9
        if side == "above" or side == "below"
          extent += w*s + h*c
        else
          extent += w*c + h*s

      return extent

    defaults: ->
      return _.extend {}, super(), {
        x_range_name: "default"
        y_range_name: "default"
      }

    display_defaults: ->
      return _.extend {}, super(), {
        level: 'overlay'
        visible: true

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

        minor_tick_in: 0
        minor_tick_out: 4
        minor_tick_line_color: 'black'
        minor_tick_line_width: 1
        minor_tick_line_alpha: 1.0
        minor_tick_line_join: 'miter'
        minor_tick_line_cap: 'butt'
        minor_tick_line_dash: []
        minor_tick_line_dash_offset: 0

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
