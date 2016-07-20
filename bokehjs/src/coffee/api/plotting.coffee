_ = require("underscore")
$ = require("jquery")
sprintf = require("sprintf")
{Document} = require("../document")
embed = require("../embed")
{BOKEH_ROOT} = require("../embed")
models = require("./models")

_default_tooltips = [
  ["index", "$index"],
  ["data (x, y)", "($x, $y)"],
  ["canvas (x, y)", "($sx, $sy)"],
]

_default_tools = "pan,wheel_zoom,box_zoom,save,reset,help"

_known_tools = {
  pan:          (plot) -> new models.PanTool(plot: plot, dimensions: ["width", "height"])
  xpan:         (plot) -> new models.PanTool(plot: plot, dimensions: ["width"])
  ypan:         (plot) -> new models.PanTool(plot: plot, dimensions: ["height"])
  wheel_zoom:   (plot) -> new models.WheelZoomTool(plot: plot, dimensions: ["width", "height"])
  xwheel_zoom:  (plot) -> new models.WheelZoomTool(plot: plot, dimensions: ["width"])
  ywheel_zoom:  (plot) -> new models.WheelZoomTool(plot: plot, dimensions: ["height"])
  resize:       (plot) -> new models.ResizeTool(plot: plot)
  click:        (plot) -> new models.TapTool(plot: plot, behavior: "inspect")
  tap:          (plot) -> new models.TapTool(plot: plot)
  crosshair:    (plot) -> new models.CrosshairTool(plot: plot)
  box_select:   (plot) -> new models.BoxSelectTool(plot: plot)
  xbox_select:  (plot) -> new models.BoxSelectTool(plot: plot, dimensions: ['width'])
  ybox_select:  (plot) -> new models.BoxSelectTool(plot: plot, dimensions: ['height'])
  poly_select:  (plot) -> new models.PolySelectTool(plot: plot)
  lasso_select: (plot) -> new models.LassoSelectTool(plot: plot)
  box_zoom:     (plot) -> new models.BoxZoomTool(plot: plot, dimensions: ['width', 'height'])
  xbox_zoom:    (plot) -> new models.BoxZoomTool(plot: plot, dimensions: ['width'])
  ybox_zoom:    (plot) -> new models.BoxZoomTool(plot: plot, dimensions: ['height'])
  hover:        (plot) -> new models.HoverTool(plot: plot, tooltips: _default_tooltips)
  save:         (plot) -> new models.SaveTool(plot: plot)
  previewsave:  (plot) -> new models.SaveTool(plot: plot)
  undo:         (plot) -> new models.UndoTool(plot: plot)
  redo:         (plot) -> new models.RedoTool(plot: plot)
  reset:        (plot) -> new models.ResetTool(plot: plot)
  help:         (plot) -> new models.HelpTool(plot: plot)
}

_with_default = (value, default_value) ->
  if value == undefined then default_value else value

class Figure extends models.Plot

  constructor: (attributes={}, options={}) ->
    attrs = _.clone(attributes)

    tools = _with_default(attrs.tools, _default_tools)
    delete attrs.tools

    attrs.x_range = @_get_range(attrs.x_range)
    attrs.y_range = @_get_range(attrs.y_range)

    x_axis_type = if _.isUndefined(attrs.x_axis_type) then "auto" else attrs.x_axis_type
    y_axis_type = if _.isUndefined(attrs.y_axis_type) then "auto" else attrs.y_axis_type
    delete attrs.x_axis_type
    delete attrs.y_axis_type

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

    if not _.isUndefined(attrs.width)
      if _.isUndefined(attrs.plot_width)
        attrs.plot_width = attrs.width
      else
        throw new Error("both 'width' and 'plot_width' can't be given at the same time")
      delete attrs.width

    if not _.isUndefined(attrs.height)
      if _.isUndefined(attrs.plot_height)
        attrs.plot_height = attrs.height
      else
        throw new Error("both 'height' and 'plot_height' can't be given at the same time")
      delete attrs.height

    super(attrs, options)

    @_process_guides(0, x_axis_type, x_axis_location, x_minor_ticks, x_axis_label)
    @_process_guides(1, y_axis_type, y_axis_location, y_minor_ticks, y_axis_label)

    @add_tools(@_process_tools(tools)...)

    @_legend = new models.Legend({plot: this})
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
  ellipse:           (args...) -> @_glyph(models.Ellipse,      "x,y,width,height",                                    args)
  gear:              (args...) -> @_glyph(models.Gear,         "x,y,module,teeth",                                    args)
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
  circle:            (args...) -> @_marker(models.Circle,           args)
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
              if _.isArray(value)
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
              else if _.isNumber(value) or _.isString(value) # or Date?
                attrs[name] = { value: value }

  _glyph: (cls, params, args) ->
    params = params.split(",")

    if args.length == 1
      [attrs] = args
      attrs = _.clone(attrs)
    else
      [args..., opts] = args
      attrs = _.clone(opts)
      for param, i in params
        do (param, i) ->
          attrs[param] = args[i]

    legend = attrs.legend
    delete attrs.legend

    has_sglyph = _.any(_.keys(attrs), (key) -> key.startsWith("selection_"))
    has_hglyph = _.any(_.keys(attrs), (key) -> key.startsWith("hover_"))

    glyph_ca   = @_pop_colors_and_alpha(cls, attrs)
    nsglyph_ca = @_pop_colors_and_alpha(cls, attrs, "nonselection_", undefined, 0.1)
    sglyph_ca  = if has_sglyph then @_pop_colors_and_alpha(cls, attrs, "selection_") else {}
    hglyph_ca  = if has_hglyph then @_pop_colors_and_alpha(cls, attrs, "hover_") else {}

    source = attrs.source ? new models.ColumnDataSource()
    data = _.clone(source.data)
    delete attrs.source

    @_fixup_values(cls, data,   glyph_ca)
    @_fixup_values(cls, data, nsglyph_ca)
    @_fixup_values(cls, data,  sglyph_ca)
    @_fixup_values(cls, data,  hglyph_ca)

    @_fixup_values(cls, data, attrs)

    source.data = data

    _make_glyph = (cls, attrs, extra_attrs) =>
      new cls(_.extend({}, attrs, extra_attrs))

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
    if _.isArray(range)
      if _.all((x) -> _.isString(x) for x in range)
        return new models.FactorRange({factors: range})
      if range.length == 2
        return new models.Range1d({start: range[0], end: range[1]})

  _process_guides: (dim, axis_type, axis_location, minor_ticks, axis_label) ->
    range = if dim == 0 then @x_range else @y_range
    axiscls = @_get_axis_class(axis_type, range)

    if axiscls?
      if axiscls == models.LogAxis
        if dim == 0
          @x_mapper_type = 'log'
        else
          @y_mapper_type = 'log'

      axis = new axiscls()

      if axis.ticker instanceof models.ContinuousTicker
        axis.ticker.num_minor_ticks = @_get_num_minor_ticks(axiscls, minor_ticks)
      if axis_label.length != 0
        axis.axis_label = axis_label

      grid = new models.Grid({dimension: dim, ticker: axis.ticker})

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
    if _.isNumber(num_minor_ticks)
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
    if _.isString(tools)
      tools = tools.split(/\s*,\s*/)

    objs = for tool in tools
      if _.isString(tool)
        _known_tools[tool](this)
      else
        tool

    return objs

  _update_legend: (legend_name, glyph_renderer) ->
    legends = _.clone(@_legend.legends)

    for [name, renderers] in legends
      if name == legend_name
        renderers.push(glyph_renderer)
        @_legend.legends = legends
        return

    legends.push([legend_name, [glyph_renderer]])
    @_legend.legends = legends

figure = (attributes={}, options={}) ->
  new Figure(attributes, options)

show = (obj, target) ->
  multiple = _.isArray(obj)

  doc = new Document()

  if not multiple
    doc.add_root(obj)
  else
    for _obj in obj
      doc.add_root(_obj)

  div = $("<div class=#{BOKEH_ROOT}>")
  $(target ? "body").append(div)

  views = embed.add_document_standalone(doc, div)

  if not multiple
    return views[obj.id]
  else
    return views

color = (r, g, b) -> sprintf("#%02x%02x%02x", r, g, b)

gridplot = (children, options={}) ->
  toolbar_location = if _.isUndefined(options.toolbar_location) then 'above' else options.toolbar_location
  sizing_mode = if _.isUndefined(options.sizing_mode) then 'fixed' else options.sizing_mode
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

module.exports = {
  Figure: Figure
  figure: figure
  show  : show
  color : color
  gridplot: gridplot
}
