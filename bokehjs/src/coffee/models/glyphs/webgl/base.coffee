# This module implements the Base GL Glyph and some utilities

import {color2rgba} from "core/util/color"

export class BaseGLGlyph

  GLYPH: ''  # name of the glyph that this gl-glyph applies to

  VERT: ''
  FRAG: ''

  constructor: (gl, glyph) ->
    @gl = gl
    @glyph = glyph

    @nvertices = 0
    @size_changed = false
    @data_changed = false
    @visuals_changed = false

    @init()

  set_data_changed: (n) ->
    if n != @nvertices
      @nvertices = n
      @size_changed = true
    @data_changed = true

  set_visuals_changed: () ->
    @visuals_changed = true

  render: (ctx, indices, mainglyph) ->
    # Get transform
    wx = wy = 1  # Weights to scale our vectors
    [dx, dy] = @glyph.renderer.map_to_screen([0*wx, 1*wx, 2*wx], [0*wy, 1*wy, 2*wy])
    # Try again, but with weighs so we're looking at ~100 in screen coordinates
    wx = 100 / Math.min(Math.max(Math.abs(dx[1] - dx[0]), 1e-12), 1e12)
    wy = 100 / Math.min(Math.max(Math.abs(dy[1] - dy[0]), 1e-12), 1e12)
    [dx, dy] = @glyph.renderer.map_to_screen([0*wx, 1*wx, 2*wx], [0*wy, 1*wy, 2*wy])
    # Test how linear it is
    if (Math.abs((dx[1] - dx[0]) - (dx[2] - dx[1])) > 1e-6 ||
        Math.abs((dy[1] - dy[0]) - (dy[2] - dy[1])) > 1e-6)
      return false
    [sx, sy] = [(dx[1]-dx[0]) / wx, (dy[1]-dy[0]) / wy]
    trans =
        pixel_ratio: ctx.pixel_ratio,  # pass pixel_ratio to webgl
        width: ctx.glcanvas.width, height: ctx.glcanvas.height,
        dx: dx[0]/sx, dy: dy[0]/sy, sx: sx, sy: sy
    @draw(indices, mainglyph, trans)
    return true  # success

export line_width = (width) ->
    # Increase small values to make it more similar to canvas
    if width < 2
      width = Math.sqrt(width*2)
    return width

export fill_array_with_float = (n, val) ->
    a = new Float32Array(n)
    for i in [0...n]
        a[i] = val
    return a

export fill_array_with_vec = (n, m, val) ->
    a = new Float32Array(n*m)
    for i in [0...n]
      for j in [0...m]
        a[i*m+j] = val[j]
    return a

export visual_prop_is_singular = (visual, propname) ->
    # This touches the internals of the visual, so we limit use in this function
    # See renderer.coffee:cache_select() for similar code
    return visual[propname].spec.value != undefined

export attach_float = (prog, vbo, att_name, n, visual, name) ->
    # Attach a float attribute to the program. Use singleton value if we can,
    # otherwise use VBO to apply array.
    if not visual.doit
      vbo.used = false
      prog.set_attribute(att_name, 'float', [0])
    else if visual_prop_is_singular(visual, name)
      vbo.used = false
      prog.set_attribute(att_name, 'float', visual[name].value())
    else
      vbo.used = true
      a = new Float32Array(visual.cache[name + '_array'])
      vbo.set_size(n*4)
      vbo.set_data(0, a)
      prog.set_attribute(att_name, 'float', vbo)

export attach_color = (prog, vbo, att_name, n, visual, prefix) ->
    # Attach the color attribute to the program. If there's just one color,
    # then use this single color for all vertices (no VBO). Otherwise we
    # create an array and upload that to the VBO, which we attahce to the prog.
    m = 4
    colorname = prefix + '_color'
    alphaname = prefix + '_alpha'

    if not visual.doit
      # Don't draw (draw transparent)
      vbo.used = false
      prog.set_attribute(att_name, 'vec4', [0,0,0,0])
    else if visual_prop_is_singular(visual, colorname) and visual_prop_is_singular(visual, alphaname)
      # Nice and simple; both color and alpha are singular
      vbo.used = false
      rgba = color2rgba(visual[colorname].value(), visual[alphaname].value())
      prog.set_attribute(att_name, 'vec4', rgba)
    else
      # Use vbo; we need an array for both the color and the alpha
      vbo.used = true
      # Get array of colors
      if visual_prop_is_singular(visual, colorname)
        colors = (visual[colorname].value() for i in [0...n])
      else
        colors = visual.cache[colorname+'_array']
      # Get array of alphas
      if visual_prop_is_singular(visual, alphaname)
        alphas = fill_array_with_float(n, visual[alphaname].value())
      else
        alphas = visual.cache[alphaname+'_array']
      # Create array of rgbs
      a = new Float32Array(n*m)
      for i in [0...n]
        rgba = color2rgba(colors[i], alphas[i])
        for j in [0...m]
          a[i*m+j] = rgba[j]
      # Attach vbo
      vbo.set_size(n*m*4)
      vbo.set_data(0, a)
      prog.set_attribute(att_name, 'vec4', vbo)
