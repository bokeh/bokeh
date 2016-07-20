_ = require "underscore"
rbush = require "rbush"

CategoricalMapper = require "../mappers/categorical_mapper"
Renderer = require "../renderers/renderer"
p = require "../../core/properties"
bbox = require "../../core/util/bbox"
Model = require "../../model"
bokehgl = require "./webgl/main"

class GlyphView extends Renderer.View

  initialize: (options) ->
    super(options)

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
          @glglyph = new Cls(ctx.glcanvas.gl, this)

  render: (ctx, indices, data) ->

    if @mget("visible")
      ctx.beginPath();

      if @glglyph?
        if @_render_gl(ctx, indices, data)
          return

      @_render(ctx, indices, data)

    return

  _render_gl: (ctx, indices, mainglyph) ->
    # Get transform
    wx = wy = 1  # Weights to scale our vectors
    [dx, dy] = @renderer.map_to_screen([0*wx, 1*wx, 2*wx], [0*wy, 1*wy, 2*wy])
    # Try again, but with weighs so we're looking at ~100 in screen coordinates
    wx = 100 / Math.min(Math.max(Math.abs(dx[1] - dx[0]), 1e-12), 1e12)
    wy = 100 / Math.min(Math.max(Math.abs(dy[1] - dy[0]), 1e-12), 1e12)
    [dx, dy] = @renderer.map_to_screen([0*wx, 1*wx, 2*wx], [0*wy, 1*wy, 2*wy])
    # Test how linear it is
    if (Math.abs((dx[1] - dx[0]) - (dx[2] - dx[1])) > 1e-6 ||
        Math.abs((dy[1] - dy[0]) - (dy[2] - dy[1])) > 1e-6)
      return false
    [sx, sy] = [(dx[1]-dx[0]) / wx, (dy[1]-dy[0]) / wy]
    trans =
        pixel_ratio: ctx.pixel_ratio,  # pass pixel_ratio to webgl
        width: ctx.glcanvas.width, height: ctx.glcanvas.height,
        dx: dx[0]/sx, dy: dy[0]/sy, sx: sx, sy: sy
    @glglyph.draw(indices, mainglyph, trans)
    return true  # success

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

  get_reference_point: () ->
    return undefined
    #reference_point = @mget('reference_point')
    #ret = if _.isNumber(reference_point)
    #  @data[reference_point]
    #else
    #  reference_point
    #return ret

  draw_legend: (ctx, x0, x1, y0, y1) -> null

  _generic_line_legend: (ctx, x0, x1, y0, y1) ->
    reference_point = @get_reference_point() ? 0
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x0, (y0 + y1) /2)
    ctx.lineTo(x1, (y0 + y1) /2)
    if @visuals.line.doit
      @visuals.line.set_vectorize(ctx, reference_point)
      ctx.stroke()
    ctx.restore()

  _generic_area_legend: (ctx, x0, x1, y0, y1) ->
    reference_point = @get_reference_point() ? 0
    indices = [reference_point]

    w = Math.abs(x1-x0)
    dw = w*0.1
    h = Math.abs(y1-y0)
    dh = h*0.1

    sx0 = x0 + dw
    sx1 = x1 - dw

    sy0 = y0 + dh
    sy1 = y1 - dh

    if @visuals.fill.doit
      @visuals.fill.set_vectorize(ctx, reference_point)
      ctx.fillRect(sx0, sy0, sx1-sx0, sy1-sy0)

    if @visuals.line.doit
      ctx.beginPath()
      ctx.rect(sx0, sy0, sx1-sx0, sy1-sy0)
      @visuals.line.set_vectorize(ctx, reference_point)
      ctx.stroke()

class Glyph extends Model
  @define {
      visible: [ p.Bool, true ]
    }

  @internal {
    x_range_name: [ p.String,      'default' ]
    y_range_name: [ p.String,      'default' ]
  }

module.exports =
  Model: Glyph
  View: GlyphView
