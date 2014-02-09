
define [
  "backbone",
  "./linear_axis",
  "common/ticking",
  "range/factor_range"
], (Backbone, LinearAxis, ticking, FactorRange) ->

  class _CategoricalFormatter
    format: (ticks) ->
      return ticks

  class CategoricalAxisView extends LinearAxis.View

    initialize: (attrs, options) ->
      super(attrs, options)
      @formatter = new _CategoricalFormatter()

  class CategoricalAxis extends Backbone.Model
    default_view: CategoricalAxisView
    type: 'CategoricalAxis'

    initialize: (attrs, options)->
      super(attrs, options)
      @register_property('rule_coords', @_rule_coords, false)
      @add_dependencies('rule_coords', this, ['dimension', 'location'])

      @register_property('major_coords', @_major_coords, false)
      @add_dependencies('major_coords', this, ['dimension', 'location'])

      @register_property('normals', @_normals, false)
      @add_dependencies('normals', this, ['dimension', 'location'])

      @register_property('side', @_side, false)
      @add_dependencies('side', this, ['normals'])

      @register_property('padding_request', @_padding_request, false)

    _rule_coords: () ->
      i = @get('dimension')
      j = (i + 1) % 2

      ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]
      mappers = [@get_obj('plot').get_obj('x_mapper'), @get_obj('plot').get_obj('y_mapper')]
      range = ranges[i]
      cross_range = ranges[j]

      [start, end] = [
        mappers[i].map_to_target(range.get('start', 'min')),
        mappers[i].map_to_target(range.get('end', 'max'))
      ]

      xs = new Float64Array(2)
      ys = new Float64Array(2)
      coords = [xs, ys]

      cstart = cross_range.get('start')
      cend = cross_range.get('end')

      loc = @get('location') ? 'min'
      pos = loc
      if _.isString(loc)
        if loc == 'left' or loc == 'bottom'
          if cstart < cend
            loc = 'start'
            pos = 'min'
          else
            loc = 'end'
            pos = 'max'
        else if loc == 'right' or loc == 'top'
          if cstart < cend
            loc = 'end'
            pos = 'max'
          else
            loc = 'start'
            pos = 'min'
        loc = cross_range.get(loc)

      if cross_range.type == "FactorRange"
        loc = mappers[i].map_to_target(loc, pos)

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
      mappers = [@get_obj('plot').get_obj('x_mapper'), @get_obj('plot').get_obj('y_mapper')]
      range = ranges[i]
      cross_range = ranges[j]

      cstart = cross_range.get('start')
      cend = cross_range.get('end')

      loc = @get('location') ? 'min'
      pos = loc
      if _.isString(loc)
        if loc == 'left' or loc == 'bottom'
          if cstart < cend
            loc = 'start'
            pos = 'min'
          else
            loc = 'end'
            pos = 'max'
        else if loc == 'right' or loc == 'top'
          if cstart < cend
            loc = 'end'
            pos = 'max'
          else
            loc = 'start'
            pos = 'min'
        loc = cross_range.get(loc)

      if cross_range.type == "FactorRange"
        loc = mappers[i].map_to_target(loc, pos)

      xs = []
      ys = []
      coords = [xs, ys]

      values = range.get('values')
      [scale, offset] = mappers[i].get('mapper_state')

      for ii in [0...values.length]
        coords[i].push(scale*ii + offset)
        coords[j].push(loc)

      return coords

    _normals: () ->
      i = @get('dimension')
      j = (i + 1) % 2

      ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]
      range = ranges[i]
      cross_range = ranges[j]

      cstart = cross_range.get('start')
      cend = cross_range.get('end')

      loc = @get('location') ? 'min'
      pos = loc
      if _.isString(loc)
        if loc == 'left' or loc == 'bottom'
          if cstart < cend
            loc = 'start'
            pos = 'min'
          else
            loc = 'end'
            pos = 'max'
        else if loc == 'right' or loc == 'top'
          if cstart < cend
            loc = 'end'
            pos = 'max'
          else
            loc = 'start'
            pos = 'min'
        loc = cross_range.get(loc)

      if cross_range.type == "FactorRange"
        cstart = mappers[i].map_to_target(cstart, pos)
        cend = mappers[i].map_to_target(cend, pos)

      normals = [0, 0]

      normals[j] = if (end-start) < 0 then -1 else 1
      if i == 0
        if (loc == 'max' and (cstart < cend)) or (loc == 'min' and (cstart > cend)) or loc == 'right' or loc == 'top'
          normals[j] *= -1
      else if i == 1
        if (loc == 'min' and (cstart < cend)) or (loc == 'max' and (cstart > cend)) or loc == 'left' or loc == 'bottom'
          normals[j] *= -1

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



  class CategoricalAxes extends Backbone.Collection
    model: CategoricalAxis
    type: 'CategoricalAxis'

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
      "Model": CategoricalAxis,
      "Collection": new CategoricalAxes(),
      "View": CategoricalAxisView
    }
