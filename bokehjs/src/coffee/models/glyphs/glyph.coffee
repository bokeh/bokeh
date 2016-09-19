_ = require "underscore"
rbush = require "rbush"

CategoricalMapper = require "../mappers/categorical_mapper"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"
bbox = require "../../core/util/bbox"
Model = require "../../model"
bokehgl = require "./webgl/main"
{logger} = require "../../core/logging"

class GlyphView extends Renderer.View

  initialize: (options) ->
    super(options)
    @_nohit_warned = {}
    @renderer = options.renderer

    # Init gl (this should really be done anytime renderer is set,
    # and not done if it isn't ever set, but for now it only
    # matters in the unit tests because we build a view without a
    # renderer there)
    if @renderer?.plot_view?
      ctx = @renderer.plot_view.canvas_view.ctx
      if ctx.glcanvas?
        Cls = bokehgl[@model.type + 'GLGlyph']
        if Cls
          @glglyph = new Cls(ctx.glcanvas.gl, @)

  set_visuals: (source) ->
    super(source)

    if @glglyph?
      @glglyph.set_visuals_changed()

  render: (ctx, indices, data) ->
    if @model.visible
      ctx.beginPath()

      if @glglyph?
        if @glglyph.render(ctx, indices, data)
          return

      @_render(ctx, indices, data)

    return

  bounds: () ->
    if not @index?
      return bbox.empty()
    d = @index.data
    bb = {minX: d.minX, minY: d.minY, maxX: d.maxX, maxY: d.maxY}
    return @_bounds(bb)

  # this is available for subclasses to use, if appropriate.
  max_wh2_bounds: (bds) ->
    return {
        minX: bds.minX - @max_w2,
        maxX: bds.maxX + @max_w2,
        minY: bds.minY - @max_h2,
        maxY: bds.maxY + @max_h2,
    }

  get_anchor_point: (anchor, i, [sx, sy]) ->
    switch anchor
      when "center" then {x: @scx(i, sx, sy), y: @scy(i, sx, sy)}
      else               null

  # glyphs that need more sophisticated "snap to data" behaviour (like
  # snapping to a patch centroid, e.g, should override these
  scx: (i) -> return @sx[i]
  scy: (i) -> return @sy[i]

  _xy_index: () ->
    index = rbush()
    pts = []

    # if the range is categorical, map to synthetic coordinates first
    if @renderer.xmapper instanceof CategoricalMapper.Model
      xx = @renderer.xmapper.v_map_to_target(@_x, true)
    else
      xx = @_x
    if @renderer.ymapper instanceof CategoricalMapper.Model
      yy = @renderer.ymapper.v_map_to_target(@_y, true)
    else
      yy = @_y

    for i in [0...xx.length]
      x = xx[i]
      if isNaN(x) or not isFinite(x)
        continue
      y = yy[i]
      if isNaN(y) or not isFinite(y)
        continue
      pts.push({minX: x, minY: y, maxX: x, maxY: y, i: i})

    index.load(pts)
    return index

  sdist: (mapper, pts, spans, pts_location="edge", dilate=false) ->
    if _.isString(pts[0])
      pts = mapper.v_map_to_target(pts)

    if pts_location == 'center'
      halfspan = (d / 2 for d in spans)
      pt0 = (pts[i] - halfspan[i] for i in [0...pts.length])
      pt1 = (pts[i] + halfspan[i] for i in [0...pts.length])
    else
      pt0 = pts
      pt1 = (pt0[i] + spans[i] for i in [0...pt0.length])

    spt0 = mapper.v_map_to_target(pt0)
    spt1 = mapper.v_map_to_target(pt1)

    if dilate
      return (Math.ceil(Math.abs(spt1[i] - spt0[i])) for i in [0...spt0.length])
    else
      return (Math.abs(spt1[i] - spt0[i]) for i in [0...spt0.length])

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    return null

  _generic_line_legend: (ctx, x0, x1, y0, y1, index) ->
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x0, (y0 + y1) /2)
    ctx.lineTo(x1, (y0 + y1) /2)
    if @visuals.line.doit
      @visuals.line.set_vectorize(ctx, index)
      ctx.stroke()
    ctx.restore()

  _generic_area_legend: (ctx, x0, x1, y0, y1, index) ->
    indices = [index]
    w = Math.abs(x1-x0)
    dw = w*0.1
    h = Math.abs(y1-y0)
    dh = h*0.1

    sx0 = x0 + dw
    sx1 = x1 - dw

    sy0 = y0 + dh
    sy1 = y1 - dh

    if @visuals.fill.doit
      @visuals.fill.set_vectorize(ctx, index)
      ctx.fillRect(sx0, sy0, sx1-sx0, sy1-sy0)

    if @visuals.line.doit
      ctx.beginPath()
      ctx.rect(sx0, sy0, sx1-sx0, sy1-sy0)
      @visuals.line.set_vectorize(ctx, index)
      ctx.stroke()

  hit_test: (geometry) ->
    result = null

    func = "_hit_#{geometry.type}"
    if @[func]?
      result = @[func](geometry)
    else if not @_nohit_warned[geometry.type]?
      logger.debug("'#{geometry.type}' selection not available for #{@model.type}")
      @_nohit_warned[geometry.type] = true

    return result

  set_data: (source) ->
    super(source)
    @index = @_index_data()

  _index_data: () -> null

  mask_data: (indices) ->
    # WebGL can do the clipping much more efficiently
    if @glglyph? then indices else @_mask_data(indices)

  _mask_data: (indices) -> indices

  _bounds: (bounds) -> bounds

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

  # This is where specs not included in coords are computed, e.g. radius.
  _map_data: () ->

class Glyph extends Model

  @define {
    visible: [ p.Bool, true ]
    label:   [ p.StringSpec, null ]
  }

  @internal {
    x_range_name: [ p.String,      'default' ]
    y_range_name: [ p.String,      'default' ]
  }

module.exports =
  Model: Glyph
  View: GlyphView
