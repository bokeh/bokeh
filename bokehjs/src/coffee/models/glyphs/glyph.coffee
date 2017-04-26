import * as p from "core/properties"
import * as bbox from "core/util/bbox"
import * as proj from "core/util/projections"
import {View} from "core/view"
import {Model} from "../../model"
import {Visuals} from "core/visuals"
import {logger} from "core/logging"
import {extend} from "core/util/object"
import {isString, isArray} from "core/util/types"

export class GlyphView extends View

  initialize: (options) ->
    super(options)
    @_nohit_warned = {}
    @renderer = options.renderer
    @visuals = new Visuals(@model)

    # Init gl (this should really be done anytime renderer is set,
    # and not done if it isn't ever set, but for now it only
    # matters in the unit tests because we build a view without a
    # renderer there)
    ctx = @renderer.plot_view.canvas_view.ctx

    if ctx.glcanvas?
      try
        glglyphs = require("models/glyphs/webgl/index")
      catch e
        if e.code == 'MODULE_NOT_FOUND'
          logger.warn('WebGL was requested and is supported, but bokeh-gl(.min).js is not available, falling back to 2D rendering.')
          glglyphs = null
        else
          throw e

      if glglyphs?
        Cls = glglyphs[@model.type + 'GLGlyph']
        if Cls?
          @glglyph = new Cls(ctx.glcanvas.gl, @)

  set_visuals: (source) ->
    @visuals.warm_cache(source)

    if @glglyph?
      @glglyph.set_visuals_changed()

  render: (ctx, indices, data) ->
    ctx.beginPath()

    if @glglyph?
      if @glglyph.render(ctx, indices, data)
        return

    @_render(ctx, indices, data)

  bounds: () ->
    if not @index?
      return bbox.empty()
    else
      return @_bounds(@index.bbox)

  log_bounds: () ->
    if not @index?
      return bbox.empty()

    bb = bbox.empty()
    positive_x_bbs = @index.search(bbox.positive_x())
    positive_y_bbs = @index.search(bbox.positive_y())
    for x in positive_x_bbs
      if x.minX < bb.minX
        bb.minX = x.minX
      if x.maxX > bb.maxX
        bb.maxX = x.maxX
    for y in positive_y_bbs
      if y.minY < bb.minY
        bb.minY = y.minY
      if y.maxY > bb.maxY
        bb.maxY = y.maxY

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

  sdist: (mapper, pts, spans, pts_location="edge", dilate=false) ->
    if isString(pts[0])
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
    data = @model.materialize_dataspecs(source)
    extend(@, data)

    if @renderer.plot_view.model.use_map
      if @_x?
        [@_x, @_y] = proj.project_xy(@_x, @_y)
      if @_xs?
        [@_xs, @_ys] = proj.project_xsys(@_xs, @_ys)

    if @glglyph?
      @glglyph.set_data_changed(@_x.length)

    @_set_data(source)

    @index = @_index_data()

  _set_data: () ->

  _index_data: () ->

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
      if isArray(@[xname]?[0]) or @[xname]?[0]?.buffer instanceof ArrayBuffer
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

  map_to_screen: (x, y) ->
    @renderer.plot_view.map_to_screen(x, y, @model.x_range_name, @model.y_range_name)

export class Glyph extends Model

  _coords: []

  @coords: (coords) ->
    _coords = this.prototype._coords.concat(coords)
    this.prototype._coords = _coords

    result = {}
    for [x, y] in coords
      result[x] = [ p.NumberSpec ]
      result[y] = [ p.NumberSpec ]

    @define(result)

  @internal {
    x_range_name: [ p.String,      'default' ]
    y_range_name: [ p.String,      'default' ]
  }
