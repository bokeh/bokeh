import * as mixins from "./property_mixins"
import {color2rgba} from "./util/color"

export class ContextProperties

  constructor: (obj, prefix="") ->
    @obj = obj
    @prefix = prefix

    @cache = {}

    do_spec = obj.properties[prefix+@do_attr].spec
    @doit = do_spec.value != null

    for attr in @attrs
      @[attr] = obj.properties[prefix+attr]

  warm_cache: (source) ->
    for attr in @attrs
      prop = @obj.properties[@prefix+attr]
      if prop.spec.value != undefined # TODO (bev) better test?
        @cache[attr] = prop.spec.value
      else
        @cache[attr+"_array"] = prop.array(source)

  cache_select: (attr, i) ->
    prop = @obj.properties[@prefix+attr]
    if prop.spec.value != undefined # TODO (bev) better test?
      @cache[attr] = prop.spec.value
    else
      @cache[attr] = @cache[attr+"_array"][i]

  set_vectorize: (ctx, i) ->
    if @all_indices? #all_indices is set by a Visuals instance associated with a CDSView
      @_set_vectorize(ctx, @all_indices[i])
    else #all_indices is not set for annotations which may have vectorized visual props
      @_set_vectorize(ctx, i)

export class Line extends ContextProperties

  attrs: Object.keys(mixins.line())
  do_attr: "line_color"

  set_value: (ctx) ->
    ctx.strokeStyle = @line_color.value()
    ctx.globalAlpha = @line_alpha.value()
    ctx.lineWidth   = @line_width.value()
    ctx.lineJoin    = @line_join.value()
    ctx.lineCap     = @line_cap.value()
    ctx.setLineDash(@line_dash.value())
    ctx.setLineDashOffset(@line_dash_offset.value())

  _set_vectorize: (ctx, i) ->
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

export class Fill extends ContextProperties

  attrs: Object.keys(mixins.fill())
  do_attr: "fill_color"

  set_value: (ctx) ->
    ctx.fillStyle   = @fill_color.value()
    ctx.globalAlpha = @fill_alpha.value()

  _set_vectorize: (ctx, i) ->
    @cache_select("fill_color", i)
    if ctx.fillStyle != @cache.fill_color
      ctx.fillStyle = @cache.fill_color

    @cache_select("fill_alpha", i)
    if ctx.globalAlpha != @cache.fill_alpha
      ctx.globalAlpha = @cache.fill_alpha

  color_value: () ->
    color = color2rgba(@fill_color.value(), @fill_alpha.value())
    return "rgba(#{color[0]*255},#{color[1]*255},#{color[2]*255},#{color[3]})"

export class Text extends ContextProperties

  attrs: Object.keys(mixins.text())
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

  _set_vectorize: (ctx, i) ->
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

export class Visuals

  constructor: (model) ->
    for spec in model.mixins
      [name, prefix=""] = spec.split(":")
      cls = switch name
        when "line" then Line
        when "fill" then Fill
        when "text" then Text
      @[prefix+name] = new cls(model, prefix)

  warm_cache: (source) ->
    for own name, prop of @
      if prop instanceof ContextProperties
        prop.warm_cache(source)

  set_all_indices: (all_indices) ->
    for own name, prop of @
      if prop instanceof ContextProperties
        prop.all_indices = all_indices
