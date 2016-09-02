_ = require "underscore"
proj4 = require "proj4"
toProjection = proj4.defs('GOOGLE')
Backbone = require "backbone"

BokehView = require "../../core/bokeh_view"
{color2rgba} = require "../../core/util/color"
{logger} = require "../../core/logging"
p = require "../../core/properties"
mixins = require "../../core/property_mixins"
{array_max} = require "../../core/util/math"
Model = require "../../model"

class _ContextProperties extends Backbone.Model

  constructor: (attrs, options) ->
    if not attrs.prefix?
      attrs.prefix = ""
    super(attrs, options)

    @cache = {}

    obj = @get('obj')
    prefix = @get('prefix')

    do_spec = obj.properties[prefix+@do_attr].spec
    @doit = not _.isNull(do_spec.value)

    for attr in @attrs
      @[attr] = obj.properties[prefix+attr]

  warm_cache: (source) ->
    for attr in @attrs
      obj = @get('obj')
      prefix = @get('prefix')
      prop = obj.properties[prefix+attr]
      if not _.isUndefined(prop.spec.value) # TODO (bev) better test?
        @cache[attr] = prop.spec.value
      else
        @cache[attr+"_array"] = prop.array(source)

  cache_select: (attr, i) ->
    obj = @get('obj')
    prefix = @get('prefix')
    prop = obj.properties[prefix+attr]
    if not _.isUndefined(prop.spec.value) # TODO (bev) better test?
      @cache[attr] = prop.spec.value
    else
      @cache[attr] = @cache[attr+"_array"][i]

class _Line extends _ContextProperties

  attrs: _.keys(mixins.line())
  do_attr: "line_color"

  set_value: (ctx) ->
    ctx.strokeStyle = @line_color.value()
    ctx.globalAlpha = @line_alpha.value()
    ctx.lineWidth   = @line_width.value()
    ctx.lineJoin    = @line_join.value()
    ctx.lineCap     = @line_cap.value()
    ctx.setLineDash(@line_dash.value())
    ctx.setLineDashOffset(@line_dash_offset.value())

  set_vectorize: (ctx, i) ->
    @cache_select("line_color", i)
    if ctx.strokeStyle != @cache.line_color
      ctx.strokeStyle = @cache.line_color

    @cache_select("line_alpha", i)
    if ctx.globalAlpha != @cache.line_alpha
      ctx.globalAlpha = @cache.line_alpha

    @cache_select("line_width", i)
    if ctx.lineWidth != @cache.line_width
      ctx.lineWidth = @cache.line_width

    @cache_select("line_join", i)
    if ctx.lineJoin != @cache.line_join
      ctx.lineJoin = @cache.line_join

    @cache_select("line_cap", i)
    if ctx.lineCap != @cache.line_cap
      ctx.lineCap = @cache.line_cap

    @cache_select("line_dash", i)
    if ctx.getLineDash() != @cache.line_dash
      ctx.setLineDash(@cache.line_dash)

    @cache_select("line_dash_offset", i)
    if ctx.getLineDashOffset() != @cache.line_dash_offset
      ctx.setLineDashOffset(@cache.line_dash_offset)

  color_value: () ->
    color = color2rgba(@line_color.value(), @line_alpha.value())
    return "rgba(#{color[0]*255},#{color[1]*255},#{color[2]*255},#{color[3]})"

class _Fill extends _ContextProperties

  attrs: _.keys(mixins.fill())
  do_attr: "fill_color"

  set_value: (ctx) ->
    ctx.fillStyle   = @fill_color.value()
    ctx.globalAlpha = @fill_alpha.value()

  set_vectorize: (ctx, i) ->
    @cache_select("fill_color", i)
    if ctx.fillStyle != @cache.fill_color
      ctx.fillStyle = @cache.fill_color

    @cache_select("fill_alpha", i)
    if ctx.globalAlpha != @cache.fill_alpha
      ctx.globalAlpha = @cache.fill_alpha

  color_value: () ->
    color = color2rgba(@fill_color.value(), @fill_alpha.value())
    return "rgba(#{color[0]*255},#{color[1]*255},#{color[2]*255},#{color[3]})"

class _Text extends _ContextProperties

  attrs: _.keys(mixins.text())
  do_attr: "text_color"

  cache_select: (name, i) ->
    if name == "font"
      val = super("text_font_style", i) + " " + super("text_font_size", i) + " " + super("text_font", i)
      @cache.font = val
    else
      super(name, i)

  font_value: () ->
    font       = @text_font.value()
    font_size  = @text_font_size.value()
    font_style = @text_font_style.value()
    return font_style + " " + font_size + " " + font

  color_value: () ->
    color = color2rgba(@text_color.value(), @text_alpha.value())
    return "rgba(#{color[0]*255},#{color[1]*255},#{color[2]*255},#{color[3]})"

  set_value: (ctx) ->
    ctx.font         = @font_value()
    ctx.fillStyle    = @text_color.value()
    ctx.globalAlpha  = @text_alpha.value()
    ctx.textAlign    = @text_align.value()
    ctx.textBaseline = @text_baseline.value()

  set_vectorize: (ctx, i) ->
    @cache_select("font", i)
    if ctx.font != @cache.font
      ctx.font = @cache.font

    @cache_select("text_color", i)
    if ctx.fillStyle != @cache.text_color
      ctx.fillStyle = @cache.text_color

    @cache_select("text_alpha", i)
    if ctx.globalAlpha != @cache.text_alpha
      ctx.globalAlpha = @cache.text_alpha

    @cache_select("text_align", i)
    if ctx.textAlign != @cache.text_align
      ctx.textAlign = @cache.text_align

    @cache_select("text_baseline", i)
    if ctx.textBaseline != @cache.text_baseline
      ctx.textBaseline = @cache.text_baseline

VISUALS =
  line: _Line
  fill: _Fill
  text: _Text

class RendererView extends BokehView

  initialize: (options) ->
    super(options)
    @plot_model = options.plot_model
    @plot_view = options.plot_view
    @nohit_warned = {}
    @visuals = {}

    for spec in @model.mixins
      [name, prefix] = spec.split(":")
      prefix ?= ""
      @visuals[prefix+name] = new VISUALS[name]({obj: @model, prefix: prefix})

  bind_bokeh_events: () ->

  request_render: () ->
    @plot_view.request_render()

  map_data: () ->
    # todo: if using gl, skip this (when is this called?)

    # map all the coordinate fields
    for [xname, yname] in @model._coords
      sxname = "s#{xname}"
      syname = "s#{yname}"
      xname = "_#{xname}"
      yname = "_#{yname}"
      if _.isArray(@[xname]?[0])
        [ @[sxname], @[syname] ] = [ [], [] ]
        for i in [0...@[xname].length]
          [sx, sy] = @map_to_screen(@[xname][i], @[yname][i])
          @[sxname].push(sx)
          @[syname].push(sy)
      else
        [ @[sxname], @[syname] ] = @map_to_screen(@[xname], @[yname])

    @_map_data()

  project_xy: (x, y) ->
    merc_x_s = []
    merc_y_s = []
    for i in [0...x.length]
      [merc_x, merc_y] = proj4(toProjection, [x[i], y[i]])
      merc_x_s[i] = merc_x
      merc_y_s[i] = merc_y
    return [merc_x_s, merc_y_s]

  project_xsys: (xs, ys) ->
    merc_xs_s = []
    merc_ys_s = []
    for i in [0...xs.length]
      [merc_x_s, merc_y_s] = @project_xy(xs[i], ys[i])
      merc_xs_s[i] = merc_x_s
      merc_ys_s[i] = merc_y_s
    return [merc_xs_s, merc_ys_s]

  set_data: (source) ->
    # set all the coordinate fields
    for name, prop of @model.properties
      if not prop.dataspec
        continue
      # this skips optional properties like radius for circles
      if (prop.optional || false) and prop.spec.value == null and (name not of @model._set_after_defaults)
        continue
      @["_#{name}"] = prop.array(source)
      if prop instanceof p.Distance
        @["max_#{name}"] = array_max(@["_#{name}"])

    if @plot_model.use_map
      if @_x?
        [@_x, @_y] = @project_xy(@_x, @_y)
      if @_xs?
        [@_xs, @_ys] = @project_xsys(@_xs, @_ys)

    if @glglyph?
      @glglyph.set_data_changed(@_x.length)

    @_set_data()

    @index = @_index_data()

  set_visuals: (source) ->
    # finally, warm the visual properties cache
    for name, prop of @visuals
      prop.warm_cache(source)

    if @glglyph?
      @glglyph.set_visuals_changed()

  _set_data: () -> null
  _map_data: () -> null
  _index_data: () -> null
  _mask_data: (inds) -> inds
  _bounds: (bds) -> bds

  hit_test: (geometry) ->
    result = null

    func = "_hit_#{geometry.type}"
    if @[func]?
      result = @[func](geometry)
    else if not @nohit_warned[geometry.type]?
      logger.debug("'#{geometry.type}' selection not available for #{@model.type}")
      @nohit_warned[geometry.type] = true

    return result

  map_to_screen: (x, y) ->
    @plot_view.map_to_screen(x, y, @mget("x_range_name"), @mget("y_range_name"))

class Renderer extends Model
  type: "Renderer"

  @define {
    level: [ p.RenderLevel, null ]
    visible: [ p.Bool, true ]
  }

module.exports =
  Model: Renderer
  View: RendererView
  Visuals: VISUALS
