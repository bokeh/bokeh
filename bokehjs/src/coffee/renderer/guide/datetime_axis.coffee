
define [
  "backbone",
  "./linear_axis",
  "common/ticking"
], (Backbone, LinearAxis, ticking) ->

  class DatetimeAxisView extends LinearAxis.View

    initialize: (attrs, options) ->
      super(attrs, options)
      @formatter = new ticking.DatetimeFormatter()

  class DatetimeAxis extends LinearAxis.Model
    #default_view: LinearAxis.View
    default_view: DatetimeAxisView
    type: 'DatetimeAxis'

    initialize: (attrs, options)->
      super(attrs, options)
      @register_property('computed_bounds', @_bounds, false)
      @add_dependencies('computed_bounds', this, ['bounds'])

      @register_property('rule_coords', @_rule_coords, false)
      @add_dependencies('rule_coords', this, ['computed_bounds', 'dimension', 'location'])

      @register_property('major_coords', @_major_coords, false)
      @add_dependencies('major_coords', this, ['computed_bounds', 'dimension', 'location'])

      @register_property('normals', @_normals, false)
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

      xs = new Float64Array(2)
      ys = new Float64Array(2)
      coords = [xs, ys]

      loc = @get('location') ? 'min'
      if _.isString(loc)
        if loc == 'left' or loc == 'bottom'
          loc = 'start'
        else if loc == 'right' or loc == 'top'
          loc = 'end'
        loc = cross_range.get(loc)

      [range_min, range_max] = [range.get('min'), range.get('max')]

      coords[i][0] = Math.max(start, range_min)
      coords[i][1] = Math.min(end, range_max)
      coords[j][0] = loc
      coords[j][1] = loc

      if coords[i][0] > coords[i][1]
        coords[i][0] = coords[i][1] = NaN

      return coords

    _major_coords: () ->
      i = @get('dimension')
      j = (i + 1) % 2

      ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]
      range = ranges[i]
      cross_range = ranges[j]

      [start, end] = @get('computed_bounds')

      interval = ticking.auto_interval(start, end)
      ticks = ticking.auto_ticks(null, null, start, end, interval)

      loc = @get('location') ? 'min'
      if _.isString(loc)
        if loc == 'left' or loc == 'bottom'
          loc = 'start'
        else if loc == 'right' or loc == 'top'
          loc = 'end'
        loc = cross_range.get(loc)

      xs = []
      ys = []
      coords = [xs, ys]

      [range_min, range_max] = [range.get('min'), range.get('max')]

      for ii in [0..ticks.length-1]
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

      loc = @get('location') ? 'min'
      cstart = cross_range.get('start')
      cend = cross_range.get('end')

      normals = [0, 0]

      if _.isString(loc)
        normals[j] = if (end-start) < 0 then -1 else 1
        if i == 0
          if (loc == 'max' and (cstart < cend)) or (loc == 'min' and (cstart > cend)) or loc == 'right' or loc == 'top'
            normals[j] *= -1
        else if i == 1
          if (loc == 'min' and (cstart < cend)) or (loc == 'max' and (cstart > cend)) or loc == 'left' or loc == 'bottom'
            normals[j] *= -1

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

    #default_view: DatetimeAxisView
    initialize: (attrs, options) ->
      super(attrs, options)


  class DatetimeAxes extends Backbone.Collection
    model: DatetimeAxis
    #model: LinearAxis.LinearAxis
    type: 'DatetimeAxis'

  return {
      "Model": DatetimeAxis,
      "Collection": new DatetimeAxes(),
      "View": DatetimeAxisView
    }
