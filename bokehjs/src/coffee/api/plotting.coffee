_ = require("underscore")
$ = require("jquery")
{Document} = require("../document")
embed = require("../embed")
models = require("./models")

_default_tooltips = [
  ["index", "$index"],
  ["data (x, y)", "($x, $y)"],
  ["canvas (x, y)", "($sx, $sy)"],
]

_default_tools = "pan,wheel_zoom,box_zoom,save,resize,reset,help"

_known_tools = {
  pan:          () -> new models.PanTool(dimensions: ["width", "height"])
  xpan:         () -> new models.PanTool(dimensions: ["width"])
  ypan:         () -> new models.PanTool(dimensions: ["height"])
  wheel_zoom:   () -> new models.WheelZoomTool(dimensions: ["width", "height"])
  xwheel_zoom:  () -> new models.WheelZoomTool(dimensions: ["width"])
  ywheel_zoom:  () -> new models.WheelZoomTool(dimensions: ["height"])
  save:         () -> new models.PreviewSaveTool()
  resize:       () -> new models.ResizeTool()
  click:        () -> new models.TapTool()
  tap:          () -> new models.TapTool()
  crosshair:    () -> new models.CrosshairTool()
  box_select:   () -> new models.BoxSelectTool()
  xbox_select:  () -> new models.BoxSelectTool(dimensions: ['width'])
  ybox_select:  () -> new models.BoxSelectTool(dimensions: ['height'])
  poly_select:  () -> new models.PolySelectTool()
  lasso_select: () -> new models.LassoSelectTool()
  box_zoom:     () -> new models.BoxZoomTool(dimensions: ['width', 'height'])
  xbox_zoom:    () -> new models.BoxZoomTool(dimensions: ['width'])
  ybox_zoom:    () -> new models.BoxZoomTool(dimensions: ['height'])
  hover:        () -> new models.HoverTool(tooltips: _default_tooltips)
  previewsave:  () -> new models.PreviewSaveTool()
  undo:         () -> new models.UndoTool()
  redo:         () -> new models.RedoTool()
  reset:        () -> new models.ResetTool()
  help:         () -> new models.HelpTool()
}

_with_default = (value, default_value) ->
  if value == undefined then default_value else value

class Figure extends models.Plot

  constructor: (attrs={}) ->
    attrs = _.clone(attrs)

    tools = _with_default(attrs.tools, _default_tools)
    delete attrs.tools

    attrs.x_range = @_get_range(attrs.x_range)
    attrs.y_range = @_get_range(attrs.y_range)

    x_axis_type = attrs.x_axis_type ? "auto"
    y_axis_type = attrs.y_axis_type ? "auto"
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

    super(attrs)

    @_process_guides(0, x_axis_type, x_axis_location, x_minor_ticks, x_axis_label)
    @_process_guides(1, y_axis_type, y_axis_location, y_minor_ticks, y_axis_label)

    @add_tools(@_process_tools(tools)...)

  Object.defineProperty this.prototype, "xgrid", {
    get: () -> @renderers.filter((r) -> r instanceof models.Grid and r.dimension == 0)[0] # TODO
  }

  Object.defineProperty this.prototype, "ygrid", {
    get: () -> @renderers.filter((r) -> r instanceof models.Grid and r.dimension == 1)[0] # TODO
  }

  annular_wedge:     (args...) -> @_glyph(models.AnnularWedge, "x,y,inner_radius,outer_radius,start_angle,end_angle", args)
  annulus:           (args...) -> @_glyph(models.Annulus,      "x,y,inner_radius,outer_radius",                       args)
  arc:               (args...) -> @_glyph(models.Arc,          "x,y,radius,start_angle,end_angle",                    args)
  bezier:            (args...) -> @_glyph(models.Bezier,       "x0,y0,x1,y1,cx0,cy0,cx1,cy1",                         args)
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

  _fixup_values: (cls, data, attrs) ->
    for name, value of attrs
      do (name, value) ->
        [prop, ...] = cls.prototype.props[name]

        if prop.prototype.dataspec
          if value?
            if _.isArray(value)
              data[name] = value
              attrs[name] = { field: name }
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

    has_sglyph = _.any(_.keys(attrs), (key) -> key.startsWith("selection_"))
    has_hglyph = _.any(_.keys(attrs), (key) -> key.startsWith("hover_"))

    glyph_ca   = @_pop_colors_and_alpha(cls, attrs)
    nsglyph_ca = @_pop_colors_and_alpha(cls, attrs, "nonselection_", undefined, 0.1)
    sglyph_ca  = if has_sglyph then @_pop_colors_and_alpha(cls, attrs, "selection_") else {}
    hglyph_ca  = if has_hglyph then @_pop_colors_and_alpha(cls, attrs, "hover_") else {}

    data = {}

    @_fixup_values(cls, data,   glyph_ca)
    @_fixup_values(cls, data, nsglyph_ca)
    @_fixup_values(cls, data,  sglyph_ca)
    @_fixup_values(cls, data,  hglyph_ca)

    @_fixup_values(cls, data, attrs)

    _make_glyph = (cls, attrs, extra_attrs) =>
      new cls(_.extend({}, attrs, extra_attrs))

    glyph   = _make_glyph(cls, attrs,   glyph_ca)
    nsglyph = _make_glyph(cls, attrs, nsglyph_ca)
    sglyph  = if has_sglyph then _make_glyph(cls, attrs,  sglyph_ca) else null
    hglyph  = if has_hglyph then _make_glyph(cls, attrs,  hglyph_ca) else null

    source = attrs.source ? new models.ColumnDataSource()
    source.data = _.extend({}, source.data, data)
    delete attrs.source

    glyph_renderer = new models.GlyphRenderer({
      data_source:        source
      glyph:              glyph
      nonselection_glyph: nsglyph
      selection_glyph:    sglyph
      hover_glyph:        hglyph
    })

    @add_renderers(glyph_renderer)

  _marker: (cls, args) -> @_glyph(cls, "x,y", args)

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

      axis = new axiscls({plot: if axis_location? then this else null})

      if axis.ticker instanceof models.ContinuousTicker
        axis.ticker.num_minor_ticks = @_get_num_minor_ticks(axiscls, minor_ticks)
      if axis_label.length != 0
        axis.axis_label = axis_label

      grid = new models.Grid({plot: this, dimension: dim, ticker: axis.ticker})

      if axis_location?
        this[axis_location] = (this[axis_location] ? []).concat([axis])

      @add_renderers(axis, grid)

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
      if range instanceof models.Range1d
        # TODO: return models.DatetimeAxis (Date type)
        return models.LinearAxis

  _get_num_minor_ticks: (axis_class, num_minor_ticks) ->
    if _.isNumber(num_minor_ticks)
      if num_minor_ticks <= 1
        throw new ValueError("num_minor_ticks must be > 1")
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
        _known_tools[tool]()
      else
        tool

    return objs

figure = (attrs={}) -> new Figure(attrs)

show = (figure, target) ->
  doc = new Document()
  doc.add_root(figure)

  div = $("<div class='bk-root'>")
  $(target ? "body").append(div)

  embed.add_document_static(div, doc)

module.exports = {
  Figure: Figure
  figure: figure
  show  : show
}
