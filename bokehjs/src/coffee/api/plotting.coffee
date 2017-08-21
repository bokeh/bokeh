import {sprintf} from "sprintf-js"
import {Document} from "../document"
import * as embed from "../embed"
import {BOKEH_ROOT} from "../embed"
import * as models from "./models"
import {div} from "../core/dom"
import {startsWith} from "../core/util/string"
import {isEqual} from "../core/util/eq"
import {any, all} from "../core/util/array"
import {extend, clone} from "../core/util/object"
import {isNumber, isString, isArray} from "../core/util/types"

_default_tooltips = [
  ["index", "$index"],
  ["data (x, y)", "($x, $y)"],
  ["canvas (x, y)", "($sx, $sy)"],
]

_default_tools = "pan,wheel_zoom,box_zoom,save,reset,help"

_known_tools = {
  pan:          () -> new models.PanTool(dimensions: 'both')
  xpan:         () -> new models.PanTool(dimensions: 'width')
  ypan:         () -> new models.PanTool(dimensions: 'height')
  wheel_zoom:   () -> new models.WheelZoomTool(dimensions: 'both')
  xwheel_zoom:  () -> new models.WheelZoomTool(dimensions: 'width')
  ywheel_zoom:  () -> new models.WheelZoomTool(dimensions: 'height')
  zoom_in:      () -> new models.ZoomInTool(dimensions: 'both')
  xzoom_in:     () -> new models.ZoomInTool(dimensions: 'width')
  yzoom_in:     () -> new models.ZoomInTool(dimensions: 'height')
  zoom_out:     () -> new models.ZoomOutTool(dimensions: 'both')
  xzoom_out:    () -> new models.ZoomOutTool(dimensions: 'width')
  yzoom_out:    () -> new models.ZoomOutTool(dimensions: 'height')
  click:        () -> new models.TapTool(behavior: "inspect")
  tap:          () -> new models.TapTool()
  crosshair:    () -> new models.CrosshairTool()
  box_select:   () -> new models.BoxSelectTool()
  xbox_select:  () -> new models.BoxSelectTool(dimensions: 'width')
  ybox_select:  () -> new models.BoxSelectTool(dimensions: 'height')
  poly_select:  () -> new models.PolySelectTool()
  lasso_select: () -> new models.LassoSelectTool()
  box_zoom:     () -> new models.BoxZoomTool(dimensions: 'both')
  xbox_zoom:    () -> new models.BoxZoomTool(dimensions: 'width')
  ybox_zoom:    () -> new models.BoxZoomTool(dimensions: 'height')
  hover:        () -> new models.HoverTool(tooltips: _default_tooltips)
  save:         () -> new models.SaveTool()
  previewsave:  () -> new models.SaveTool()
  undo:         () -> new models.UndoTool()
  redo:         () -> new models.RedoTool()
  reset:        () -> new models.ResetTool()
  help:         () -> new models.HelpTool()
}

_with_default = (value, default_value) ->
  if value == undefined then default_value else value

export class Figure extends models.Plot

  constructor: (attributes={}, options={}) ->
    attrs = clone(attributes)

    tools = _with_default(attrs.tools, _default_tools)
    delete attrs.tools

    attrs.x_range = @_get_range(attrs.x_range)
    attrs.y_range = @_get_range(attrs.y_range)

    x_axis_type = if attrs.x_axis_type == undefined then "auto" else attrs.x_axis_type
    y_axis_type = if attrs.y_axis_type == undefined then "auto" else attrs.y_axis_type
    delete attrs.x_axis_type
    delete attrs.y_axis_type

    attrs.x_scale = @_get_scale(attrs.x_range, x_axis_type)
    attrs.y_scale = @_get_scale(attrs.y_range, y_axis_type)

    x_minor_ticks = attrs.x_minor_ticks ? "auto"
    y_minor_ticks = attrs.y_minor_ticks ? "auto"
    delete attrs.x_minor_ticks
    delete attrs.y_minor_ticks

    x_axis_location = attrs.x_axis_location ? "below"
    y_axis_location = attrs.y_axis_location ? "left"
    delete attrs.x_axis_location
    delete attrs.y_axis_location

    x_axis_label = attrs.x_axis_label ? ""
    y_axis_label = attrs.y_axis_label ? ""
    delete attrs.x_axis_label
    delete attrs.y_axis_label

    if attrs.width != undefined
      if attrs.plot_width == undefined
        attrs.plot_width = attrs.width
      else
        throw new Error("both 'width' and 'plot_width' can't be given at the same time")
      delete attrs.width

    if attrs.height != undefined
      if attrs.plot_height == undefined
        attrs.plot_height = attrs.height
      else
        throw new Error("both 'height' and 'plot_height' can't be given at the same time")
      delete attrs.height

    super(attrs, options)

    @_process_axis_and_grid(x_axis_type, x_axis_location, x_minor_ticks, x_axis_label, attrs.x_range, 0)
    @_process_axis_and_grid(y_axis_type, y_axis_location, y_minor_ticks, y_axis_label, attrs.y_range, 1)

    @add_tools(@_process_tools(tools)...)

    @_legend = new models.Legend({plot: this, items: []})
    @add_renderers(@_legend)

  Object.defineProperty this.prototype, "xgrid", {
    get: () -> @renderers.filter((r) -> r instanceof models.Grid and r.dimension == 0)[0] # TODO
  }

  Object.defineProperty this.prototype, "ygrid", {
    get: () -> @renderers.filter((r) -> r instanceof models.Grid and r.dimension == 1)[0] # TODO
  }

  Object.defineProperty this.prototype, "xaxis", {
    get: () -> @below.concat(@above).filter((r) -> r instanceof models.Axis)[0] # TODO
  }

  Object.defineProperty this.prototype, "yaxis", {
    get: () -> @left.concat(@right).filter((r) -> r instanceof models.Axis)[0] # TODO
  }

  annular_wedge:     (args...) -> @_glyph(models.AnnularWedge, "x,y,inner_radius,outer_radius,start_angle,end_angle", args)
  annulus:           (args...) -> @_glyph(models.Annulus,      "x,y,inner_radius,outer_radius",                       args)
  arc:               (args...) -> @_glyph(models.Arc,          "x,y,radius,start_angle,end_angle",                    args)
  bezier:            (args...) -> @_glyph(models.Bezier,       "x0,y0,x1,y1,cx0,cy0,cx1,cy1",                         args)
  circle:            (args...) -> @_glyph(models.Circle,       "x,y",                                                 args)
  ellipse:           (args...) -> @_glyph(models.Ellipse,      "x,y,width,height",                                    args)
  image:             (args...) -> @_glyph(models.Image,        "color_mapper,image,rows,cols,x,y,dw,dh",              args)
  image_rgba:        (args...) -> @_glyph(models.ImageRGBA,    "image,rows,cols,x,y,dw,dh",                           args)
  image_url:         (args...) -> @_glyph(models.ImageURL,     "url,x,y,w,h",                                         args)
  line:              (args...) -> @_glyph(models.Line,         "x,y",                                                 args)
  multi_line:        (args...) -> @_glyph(models.MultiLine,    "xs,ys",                                               args)
  oval:              (args...) -> @_glyph(models.Oval,         "x,y,width,height",                                    args)
  patch:             (args...) -> @_glyph(models.Patch,        "x,y",                                                 args)
  patches:           (args...) -> @_glyph(models.Patches,      "xs,ys",                                               args)
  quad:              (args...) -> @_glyph(models.Quad,         "left,right,bottom,top",                               args)
  quadratic:         (args...) -> @_glyph(models.Quadratic,    "x0,y0,x1,y1,cx,cy",                                   args)
  ray:               (args...) -> @_glyph(models.Ray,          "x,y,length",                                          args)
  rect:              (args...) -> @_glyph(models.Rect,         "x,y,width,height",                                    args)
  segment:           (args...) -> @_glyph(models.Segment,      "x0,y0,x1,y1",                                         args)
  text:              (args...) -> @_glyph(models.Text,         "x,y,text",                                            args)
  wedge:             (args...) -> @_glyph(models.Wedge,        "x,y,radius,start_angle,end_angle",                    args)

  asterisk:          (args...) -> @_marker(models.Asterisk,         args)
  circle_cross:      (args...) -> @_marker(models.CircleCross,      args)
  circle_x:          (args...) -> @_marker(models.CircleX,          args)
  cross:             (args...) -> @_marker(models.Cross,            args)
  diamond:           (args...) -> @_marker(models.Diamond,          args)
  diamond_cross:     (args...) -> @_marker(models.DiamondCross,     args)
  inverted_triangle: (args...) -> @_marker(models.InvertedTriangle, args)
  square:            (args...) -> @_marker(models.Square,           args)
  square_cross:      (args...) -> @_marker(models.SquareCross,      args)
  square_x:          (args...) -> @_marker(models.SquareX,          args)
  triangle:          (args...) -> @_marker(models.Triangle,         args)
  x:                 (args...) -> @_marker(models.X,                args)

  _vectorable: [
      "fill_color", "fill_alpha",
      "line_color", "line_alpha", "line_width",
      "text_color", "text_alpha", "text_font_size",
  ]

  _default_color: "#1f77b4"
  _default_alpha: 1.0

  _pop_colors_and_alpha: (cls, attrs, prefix="", default_color=@_default_color, default_alpha=@_default_alpha) ->
      result = {}

      color = _with_default(attrs[prefix + "color"], default_color)
      alpha = _with_default(attrs[prefix + "alpha"], default_alpha)

      delete attrs[prefix + "color"]
      delete attrs[prefix + "alpha"]

      _update_with = (name, default_value) ->
        if cls.prototype.props[name]?
          result[name] = _with_default(attrs[prefix + name], default_value)
          delete attrs[prefix + name]

      _update_with("fill_color", color)
      _update_with("line_color", color)
      _update_with("text_color", "black")

      _update_with("fill_alpha", alpha)
      _update_with("line_alpha", alpha)
      _update_with("text_alpha", alpha)

      return result

  _find_uniq_name: (data, name) ->
    i = 1
    while true
      new_name = "#{name}__#{i}"
      if data[new_name]?
        i += 1
      else
        return new_name

  _fixup_values: (cls, data, attrs) ->
    for name, value of attrs
      do (name, value) =>
        prop = cls.prototype.props[name]

        if prop?
          if prop.type.prototype.dataspec
            if value?
              if isArray(value)
                if data[name]?
                  if data[name] != value
                    field = @_find_uniq_name(data, name)
                    data[field] = value
                  else
                    field = name
                else
                  field = name
                  data[field] = value

                attrs[name] = { field: field }
              else if isNumber(value) or isString(value) # or Date?
                attrs[name] = { value: value }

  _glyph: (cls, params, args) ->
    params = params.split(",")

    if args.length == 1
      [attrs] = args
      attrs = clone(attrs)
    else
      [args..., opts] = args
      attrs = clone(opts)
      for param, i in params
        do (param, i) ->
          attrs[param] = args[i]

    legend = @_process_legend(attrs.legend, attrs.source)
    delete attrs.legend

    has_sglyph = any(Object.keys(attrs), (key) -> startsWith(key, "selection_"))
    has_hglyph = any(Object.keys(attrs), (key) -> startsWith(key, "hover_"))

    glyph_ca   = @_pop_colors_and_alpha(cls, attrs)
    nsglyph_ca = @_pop_colors_and_alpha(cls, attrs, "nonselection_", undefined, 0.1)
    sglyph_ca  = if has_sglyph then @_pop_colors_and_alpha(cls, attrs, "selection_") else {}
    hglyph_ca  = if has_hglyph then @_pop_colors_and_alpha(cls, attrs, "hover_") else {}

    source = attrs.source ? new models.ColumnDataSource()
    data = clone(source.data)
    delete attrs.source

    @_fixup_values(cls, data,   glyph_ca)
    @_fixup_values(cls, data, nsglyph_ca)
    @_fixup_values(cls, data,  sglyph_ca)
    @_fixup_values(cls, data,  hglyph_ca)

    @_fixup_values(cls, data, attrs)

    source.data = data

    _make_glyph = (cls, attrs, extra_attrs) =>
      new cls(extend({}, attrs, extra_attrs))

    glyph   = _make_glyph(cls, attrs,   glyph_ca)
    nsglyph = _make_glyph(cls, attrs, nsglyph_ca)
    sglyph  = if has_sglyph then _make_glyph(cls, attrs,  sglyph_ca) else null
    hglyph  = if has_hglyph then _make_glyph(cls, attrs,  hglyph_ca) else null

    glyph_renderer = new models.GlyphRenderer({
      data_source:        source
      glyph:              glyph
      nonselection_glyph: nsglyph
      selection_glyph:    sglyph
      hover_glyph:        hglyph
    })

    if legend?
      @_update_legend(legend, glyph_renderer)

    @add_renderers(glyph_renderer)
    return glyph_renderer

  _marker: (cls, args) ->
    return @_glyph(cls, "x,y", args)

  _get_range: (range) ->
    if not range?
      return new models.DataRange1d()
    if range instanceof models.Range
      return range
    if isArray(range)
      if all(range, isString)
        return new models.FactorRange({factors: range})
      if range.length == 2
        return new models.Range1d({start: range[0], end: range[1]})

  _get_scale: (range_input, axis_type) ->
    if range_input instanceof models.DataRange1d or range_input instanceof models.Range1d
      switch axis_type
        when "linear", "datetime", "auto", null
          return new models.LinearScale()
        when "log"
          return new models.LogScale()

    if range_input instanceof models.FactorRange
      return new models.CategoricalScale()

    throw new Error("unable to determine proper scale for: '#{range_input}'")

  _process_axis_and_grid: (axis_type, axis_location, minor_ticks, axis_label, rng, dim) ->
    axiscls = @_get_axis_class(axis_type, rng)
    if axiscls?
      if axiscls == models.LogAxis
        if dim == 0
          @x_scale = new models.LogScale()
        else
          @y_scale = new models.LogScale()

      axis = new axiscls()

      if axis.ticker instanceof models.ContinuousTicker
        axis.ticker.num_minor_ticks = @_get_num_minor_ticks(axiscls, minor_ticks)
      if axis_label.length != 0
        axis.axis_label = axis_label

      grid = new models.Grid({dimension: dim, ticker: axis.ticker})

      if axis_location != null
        @add_layout(axis, axis_location)
      @add_layout(grid)

  _get_axis_class: (axis_type, range) ->
    if not axis_type?
      return null
    if axis_type == "linear"
      return models.LinearAxis
    if axis_type == "log"
      return models.LogAxis
    if axis_type == "datetime"
      return models.DatetimeAxis
    if axis_type == "auto"
      if range instanceof models.FactorRange
        return models.CategoricalAxis
      else
        # TODO: return models.DatetimeAxis (Date type)
        return models.LinearAxis

  _get_num_minor_ticks: (axis_class, num_minor_ticks) ->
    if isNumber(num_minor_ticks)
      if num_minor_ticks <= 1
        throw new Error("num_minor_ticks must be > 1")
      return num_minor_ticks
    if not num_minor_ticks?
      return 0
    if num_minor_ticks == 'auto'
      if axis_class == models.LogAxis
        return 10
      return 5

  _process_tools: (tools) ->
    if isString(tools)
      tools = tools.split(/\s*,\s*/).filter((tool) -> tool.length > 0)

    objs = for tool in tools
      if isString(tool)
        if _known_tools.hasOwnProperty(tool)
          _known_tools[tool]()
        else
          throw new Error("unknown tool type: #{tool}")
      else
        tool

    return objs

  _process_legend: (legend, source) ->
    legend_item_label = null
    if legend?
      if isString(legend)
        legend_item_label = { value: legend }
        if source? and source.column_names?
          if legend in source.column_names
            legend_item_label = { field: legend }
      else
        legend_item_label = legend
    return legend_item_label

  _update_legend: (legend_item_label, glyph_renderer) ->
    added = false
    for item in @_legend.items
      if isEqual(item.label, legend_item_label)
        if item.label.value?
          item.renderers.push(glyph_renderer)
          added = true
          break
        if item.label.field? and glyph_renderer.data_source == item.renderers[0].data_source
          item.renderers.push(glyph_renderer)
          added = true
          break
    if not added
      new_item = new models.LegendItem({ label: legend_item_label, renderers: [glyph_renderer] })
      @_legend.items.push(new_item)


export figure = (attributes={}, options={}) ->
  new Figure(attributes, options)

export show = (obj, target) ->
  multiple = isArray(obj)

  doc = new Document()

  if not multiple
    doc.add_root(obj)
  else
    for _obj in obj
      doc.add_root(_obj)

  if not target?
    element = document.body
  else if isString(target)
    element = document.querySelector(target)
    if not element?
      throw new Error("'#{target}' selector didn't match any elements")
  else if target instanceof HTMLElement
    element = target
  else if $? and target instanceof $
    element = target[0]
  else
    throw new Error("target should be HTMLElement, string selector, $ or null")

  root = div({class: BOKEH_ROOT})
  element.appendChild(root)

  views = embed.add_document_standalone(doc, root)

  if not multiple
    return views[obj.id]
  else
    return views

export color = (r, g, b) -> sprintf("#%02x%02x%02x", r, g, b)

export gridplot = (children, options={}) ->
  toolbar_location = if options.toolbar_location == undefined then 'above' else options.toolbar_location
  sizing_mode = if options.sizing_mode == undefined then 'fixed' else options.sizing_mode
  toolbar_sizing_mode = if options.sizing_mode == 'fixed' then 'scale_width' else sizing_mode

  tools = []
  rows = []

  for row in children
    row_tools = []
    row_children = []
    for item in row
      if item instanceof models.Plot
        row_tools = row_tools.concat(item.toolbar.tools)
        item.toolbar_location = null
      if item == null
        for neighbor in row
          if neighbor instanceof models.Plot
            break
        item = new models.Spacer({width: neighbor.plot_width, height: neighbor.plot_height})
      if item instanceof models.LayoutDOM
        item.sizing_mode = sizing_mode
        row_children.push(item)
      else
        throw new Error("only LayoutDOM items can be inserted into Grid")
    tools = tools.concat(row_tools)
    row = new models.Row({children: row_children, sizing_mode: sizing_mode})
    rows.push(row)

  grid = new models.Column({children: rows, sizing_mode: sizing_mode})

  layout = if toolbar_location
    toolbar = new models.ToolbarBox({tools: tools, sizing_mode: toolbar_sizing_mode, toolbar_location: toolbar_location})

    switch toolbar_location
      when 'above'
        new models.Column({children: [toolbar, grid], sizing_mode: sizing_mode})
      when 'below'
        new models.Column({children: [grid, toolbar], sizing_mode: sizing_mode})
      when 'left'
        new models.Row({children: [toolbar, grid], sizing_mode: sizing_mode})
      when 'right'
        new models.Row({children: [grid, toolbar], sizing_mode: sizing_mode})
  else
    grid

  return layout
