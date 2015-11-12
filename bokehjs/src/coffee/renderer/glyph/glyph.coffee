_ = require "underscore"
rbush = require "rbush"
bbox = require "../../common/bbox"
{logger} = require "../../common/logging"
{arrayMax} = require "../../common/mathutils"
HasParent = require "../../common/has_parent"
ContinuumView = require "../../common/continuum_view"
properties = require "../../common/properties"
CategoricalMapper = require "../../mapper/categorical_mapper"
proj4 = require "proj4"
toProjection = proj4.defs('GOOGLE')

class GlyphView extends ContinuumView

  initialize: (options) ->
    super(options)

    @renderer = options.renderer

    # Init gl
    ctx = @renderer.plot_view.canvas_view.ctx
    if ctx.glcanvas?
      @_init_gl(ctx.glcanvas.gl)

    for name, func of properties.factories
      @[name] = {}
      @[name] = _.extend(@[name], func(@model))

    @warned = {}

    return @

  render: (ctx, indices, data) ->

    if @mget("visible")
      ctx.beginPath();

      if @glglyph?
        if @_render_gl(ctx, indices, data)
          return

      @_render(ctx, indices, data)
  
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
    
    trans = 
        width: ctx.glcanvas.width, height: ctx.glcanvas.height, 
        dx: dx, dy: dy, sx: (dx[1]-dx[0])/wx, sy: (dy[1]-dy[0])/wy
    @glglyph.draw(indices, mainglyph, trans)
    return true  # success

  map_data: () ->
    
    # todo: if using gl, skip this (when is this called?)
    
    # map all the coordinate fields
    for [xname, yname] in @model.coords
      sxname = "s#{xname}"
      syname = "s#{yname}"
      if _.isArray(@[xname]?[0])
        [ @[sxname], @[syname] ] = [ [], [] ]
        for i in [0...@[xname].length]
          [sx, sy] = @renderer.map_to_screen(@[xname][i], @[yname][i])
          @[sxname].push(sx)
          @[syname].push(sy)
      else
        [ @[sxname], @[syname] ] = @renderer.map_to_screen(@[xname], @[yname])

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
    for name, prop of @coords
      @[name] = prop.array(source)

    if @renderer.plot_model.use_map
      if @x?
        [@x, @y] = @project_xy(@x, @y)
      if @xs?
        [@xs, @ys] = @project_xsys(@xs, @ys)

    # set any angles (will be in radian units at this point)
    for name, prop of @angles
      @[name] = prop.array(source)

    # set any distances as well as their max
    for name, prop of @distances
      @[name] = prop.array(source)
      @["max_#{name}"] = arrayMax(@[name])

    # set any misc fields
    for name, prop of @fields
      @[name] = prop.array(source)

    if @glglyph?
      @glglyph.set_data_changed(@x.length)

    @_set_data()

    @index = @_index_data()

  set_visuals: (source) ->
    # finally, warm the visual properties cache
    for name, prop of @visuals
      prop.warm_cache(source)
    
    if @glglyph?
      @glglyph.set_visuals_changed()

  bounds: () ->
    if not @index?
      return bbox.empty()
    bb = @index.data.bbox
    return @_bounds([
      [bb[0], bb[2]],
      [bb[1], bb[3]]
    ])

  # glyphs that need more sophisticated "snap to data" behaviour (like
  # snapping to a patch centroid, e.g, should override these
  scx: (i) -> return @sx[i]
  scy: (i) -> return @sy[i]

  # any additional customization can happen here
  _init_gl: () -> false
  _set_data: () -> null
  _map_data: () -> null
  _mask_data: (inds) -> inds
  _bounds: (bds) -> bds

  _xy_index: () ->
    index = rbush()
    pts = []

    # if the range is categorical, map to synthetic coordinates first
    if @renderer.xmapper instanceof CategoricalMapper.Model
      xx = @renderer.xmapper.v_map_to_target(@x, true)
    else
      xx = @x
    if @renderer.ymapper instanceof CategoricalMapper.Model
      yy = @renderer.ymapper.v_map_to_target(@y, true)
    else
      yy = @y

    for i in [0...xx.length]
      x = xx[i]
      if isNaN(x) or not isFinite(x)
        continue
      y = yy[i]
      if isNaN(y) or not isFinite(y)
        continue
      pts.push([x, y, x, y, {'i': i}])

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

  hit_test: (geometry) ->
    result = null

    func = "_hit_#{geometry.type}"
    if @[func]?
      result = @[func](geometry)
    else if not @warned[geometry.type]?
      logger.error("'#{geometry.type}' selection not available for #{@model.type}")
      @warned[geometry.type] = true

    return result

  get_reference_point: () ->
    reference_point = @mget('reference_point')
    if _.isNumber(reference_point)
      return @data[reference_point]
    else
      return reference_point

  draw_legend: (ctx, x0, x1, y0, y1) -> null

  _generic_line_legend: (ctx, x0, x1, y0, y1) ->
    reference_point = @get_reference_point() ? 0
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x0, (y0 + y1) /2)
    ctx.lineTo(x1, (y0 + y1) /2)
    if @visuals.line.do_stroke
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

    if @visuals.fill.do_fill
      @visuals.fill.set_vectorize(ctx, reference_point)
      ctx.fillRect(sx0, sy0, sx1-sx0, sy1-sy0)

    if @visuals.line.do_stroke
      ctx.beginPath()
      ctx.rect(sx0, sy0, sx1-sx0, sy1-sy0)
      @visuals.line.set_vectorize(ctx, reference_point)
      ctx.stroke()

class Glyph extends HasParent

  # Most glyphs have line and fill props. Override this in subclasses
  # that need to define a different set of visual properties
  visuals: ['line', 'fill']

  # Many glyphs have simple x and y coordinates. Override this in
  # subclasses that use other coordinates
  coords: [ ['x', 'y'] ]

  # Any distance values (which have screen/data units) go here
  distances: []

  # Any angle values (which have deg/rad units) go here
  angles: []

  # Any other data values go here
  fields: []

  fill_defaults: {
    fill_color: 'gray'
    fill_alpha: 1.0
  }

  line_defaults: {
    line_color: 'black'
    line_width: 1
    line_alpha: 1.0
    line_join: 'miter'
    line_cap: 'butt'
    line_dash: []
    line_dash_offset: 0
  }

  text_defaults: {
    text_font: "helvetica"
    text_font_size: "12pt"
    text_font_style: "normal"
    text_color: "#444444"
    text_alpha: 1.0
    text_align: "left"
    text_baseline: "bottom"
  }

  defaults: ->
    return _.extend {
      visible: true
    }

  display_defaults: ->
    result = {}
    for prop in @visuals
      switch prop
        when 'line' then defaults = @line_defaults
        when 'fill' then defaults = @fill_defaults
        when 'text' then defaults = @text_defaults
        else
          logger.warn("unknown visual property type '#{prop}'")
          continue
      result = _.extend result, super(), defaults
    return result

module.exports =
  Model: Glyph
  View: GlyphView
