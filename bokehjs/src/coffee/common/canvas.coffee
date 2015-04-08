_ = require "underscore"
$ = require "jquery"
jquery_ui = require "jquery-ui"
vispy = require "vispy"
kiwi = if global._bokehTest? then global._bokehTest.kiwi else require "kiwi"
{Expression, Constraint, Operator} = kiwi
canvas_template = require "./canvas_template"
ContinuumView = require "./continuum_view"
LayoutBox = require "./layout_box"
{logger} = require "./logging"
Solver = require "./solver"

# So we have now modified this class to use a gl canvas instead of a 2D canvas,
# but we still have the 2D canvas, and we're going to render the image of the 2D
# canvas into the gl canvas. In this way, the rest of bokehjs can keep working
# as it is, and we can update glyphs individually to make them use GL.
# TODO: this functionality to create/assign the canvases should probably be moved 
# to plot.coffee

create_gl_vis = (canvas2d, canvas3d) ->
  # This function sets up the visualization to render the 2D canvas into
  # the 3D canvas. So as to blend the two.
      
  VERT = """
  precision mediump float;
  attribute vec2 a_position;
  varying vec2 v_position;
  void main() { 
      gl_Position = vec4(0.95 * (a_position*2.0-1.0), 0.0, 1.0);
      v_position = a_position;
  }"""
  FRAG = """
  precision mediump float;
  uniform sampler2D tex;
  varying vec2 v_position;
  void main() {
      gl_FragColor = texture2D(tex, vec2(v_position.x, 1.0-v_position.y));
      gl_FragColor.a = 1.0;
  }"""
  
  VERT_DATA = new Float32Array([0.0, 0.0,  1.0, 0.0,  0.0, 1.0,  0.0, 1.0,  1.0, 0.0,  1.0, 1.0, ])
  
  console.log([canvas3d, canvas3d.id])
  window.canvas3d = canvas3d
  glx = vispy.init(canvas3d)
  
  glx._initialize = (event) ->
    @command ['CREATE', 'ctx_prog', 'Program']
    @command ['SHADERS', 'ctx_prog', VERT, FRAG]
    
    @command(['CREATE', 'ctx_tex', 'Texture2D']);    
    @command(['INTERPOLATION', 'ctx_tex', 'LINEAR', 'NEAREST']);
    @command(['WRAPPING', 'ctx_tex', ['CLAMP_TO_EDGE', 'CLAMP_TO_EDGE']]);
    
    @command(['CREATE', 'ctx_vert', 'VertexBuffer']);
    @command(['DATA', 'ctx_vert', 0, VERT_DATA]);     
    # connect
    @command(['ATTRIBUTE', 'ctx_prog', 'a_position', 'vec2', ['ctx_vert', 0, 0]]);
    @command(['TEXTURE', 'ctx_prog', 'u_sampler', 'ctx_tex']);    
    #@command(['FUNC', 'blendFunc', 'SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA']);
    @command(['FUNC', 'enable', 'BLEND']);
    
  glx._render = () ->
    # Update texture
    @command(['DATA', 'ctx_tex', [0, 0], canvas2d])
    # Render it
    console.log('rendering GL ...')
    @command(['FUNC', 'clearColor', 0, 1, 1, 1])
    @command(['FUNC', 'clear', 'COLOR_BUFFER_BIT | DEPTH_BUFFER_BIT'])    
    @command(['DRAW', 'ctx_prog', 'TRIANGLES', [0, 6]])
    # We "manually" push the commands, we don't use Vispy's event loop
    glx.execute_pending_commands()    
    
  glx._resize = (width, height) ->
    @command(['FUNC', 'viewport', 0, 0, width, height]);  
    @command(['SIZE', 'ctx_tex', [width, height], 'RGBA']);
 
  glx._initialize()
  glx._resize(canvas3d.width, canvas3d.height)
  glx
  

class CanvasView extends ContinuumView
  className: "bk-canvas-wrapper"
  template: canvas_template

  initialize: (options) ->
    super(options)

    template_data = {
      map: @mget('map')
    }
    html = @template(template_data)
    @$el.html(html)

    # for compat, to be removed
    @canvas_wrapper = @$el

    @canvas = @$('canvas.bk-canvas')
    @canvas_events = @$('div.bk-canvas-events')
    @canvas_overlay = @$('div.bk-canvas-overlays')
    @map_div = @$('div.bk-canvas-map') ? null

    logger.debug("CanvasView initialized")

  init_canvases: () ->
    @canvas3d = @canvas[0]
    gl = @canvas3d.getContext("webgl") || @canvas3d.getContext("experimental-webgl")      
    if gl?
      @canvas2d = document.createElement('canvas')
      @glx = create_gl_vis(@canvas2d, @canvas3d)
    else
      @canvas2d = @canvas3d
      @canvas3d = null      

  render: (force=false) ->
    # normally we only want to render the canvas when the canvas itself
    # should be configured with new bounds.
    if not @model.new_bounds and not force
      return
    console.log('in render canvas')
    
    # Assign canvases if not already done. Sync size of canvas2d with that of canvas3d
    if not @canvas2d?
      @init_canvases()
    if @canvas3d?
      @canvas2d.width = @canvas3d.width
      @canvas2d.height = @canvas3d.height
      @glx._resize(canvas3d.width, canvas3d.height)  # todo: only when resizing
    
    @ctx = @canvas2d.getContext('2d') 
    
    if @mget('use_hidpi')
      devicePixelRatio = window.devicePixelRatio || 1
      backingStoreRatio = @ctx.webkitBackingStorePixelRatio ||
                          @ctx.mozBackingStorePixelRatio ||
                          @ctx.msBackingStorePixelRatio ||
                          @ctx.oBackingStorePixelRatio ||
                          @ctx.backingStorePixelRatio || 1  # ak: wtf?
      ratio = devicePixelRatio / backingStoreRatio
    else
      ratio = 1
    
    width = @mget('width')
    height = @mget('height')

    @$el.attr('style', "z-index: 50; width:#{width}px; height:#{height}px")
    @canvas.attr('style', "width:#{width}px;height:#{height}px")
    @canvas.attr('width', width*ratio).attr('height', height*ratio)
    @$el.attr("width", width).attr('height', height)

    @canvas_events.attr('style', "z-index:100; position:absolute; top:0; left:0; width:#{width}px; height:#{height}px;")
    @canvas_overlay.attr('style', "z-index:75; position:absolute; top:0; left:0; width:#{width}px; height:#{height}px;")

    @ctx.scale(ratio, ratio)
    @ctx.translate(0.5, 0.5)

    # work around canvas incompatibilities
    # todo: this is done ON EACH DRAW, is that intended?
    @_fixup_line_dash(@ctx)
    @_fixup_line_dash_offset(@ctx)
    @_fixup_image_smoothing(@ctx)
    @_fixup_measure_text(@ctx)

    @model.new_bounds = false

  _fixup_line_dash: (ctx) ->
    if (!ctx.setLineDash)
      ctx.setLineDash = (dash) ->
        ctx.mozDash = dash
        ctx.webkitLineDash = dash
    if (!ctx.getLineDash)
      ctx.getLineDash = () ->
        return ctx.mozDash

  _fixup_line_dash_offset: (ctx) ->
    ctx.setLineDashOffset = (dash_offset) ->
      ctx.lineDashOffset = dash_offset
      ctx.mozDashOffset = dash_offset
      ctx.webkitLineDashOffset = dash_offset
    ctx.getLineDashOffset = () ->
      return ctx.mozDashOffset

  _fixup_image_smoothing: (ctx) ->
    ctx.setImageSmoothingEnabled = (value) ->
      ctx.imageSmoothingEnabled = value;
      ctx.mozImageSmoothingEnabled = value;
      ctx.oImageSmoothingEnabled = value;
      ctx.webkitImageSmoothingEnabled = value;
    ctx.getImageSmoothingEnabled = () ->
      return ctx.imageSmoothingEnabled ? true

  _fixup_measure_text: (ctx) ->
    if ctx.measureText and not ctx.html5MeasureText?
      ctx.html5MeasureText = ctx.measureText

      ctx.measureText = (text) ->
        textMetrics = ctx.html5MeasureText(text)
        # fake it til you make it
        textMetrics.ascent = ctx.html5MeasureText("m").width * 1.6
        return textMetrics

class Canvas extends LayoutBox.Model
  type: 'Canvas'
  default_view: CanvasView

  initialize: (attr, options) ->
    solver = new Solver()
    @set('solver', solver)
    super(attr, options)

    @new_bounds = true

    solver.add_constraint(new Constraint(new Expression(@_left), Operator.Eq))
    solver.add_constraint(new Constraint(new Expression(@_bottom), Operator.Eq))
    @_set_dims([@get('canvas_width'), @get('canvas_height')])

    logger.debug("Canvas initialized")

  # transform view coordinates to underlying screen coordinates
  vx_to_sx: (x) ->
    return x

  vy_to_sy: (y) ->
    # Note: +1 to account for 1px canvas dilation
    return @get('height') - (y + 1)

  # vectorized versions of vx_to_sx/vy_to_sy, these are mutating, in-place operations
  v_vx_to_sx: (xx) ->
    for x, idx in xx
      xx[idx] = x
    return xx

  v_vy_to_sy: (yy) ->
    canvas_height = @get('height')
    # Note: +1 to account for 1px canvas dilation
    for y, idx in yy
      yy[idx] = canvas_height - (y + 1)
    return yy

  # transform underlying screen coordinates to view coordinates
  sx_to_vx: (x) ->
    return x

  sy_to_vy: (y) ->
    # Note: +1 to account for 1px canvas dilation
    return @get('height') - (y + 1)

  # vectorized versions of sx_to_vx/sy_to_vy, these are mutating, in-place operations
  v_sx_to_vx: (xx) ->
    for x, idx in xx
      xx[idx] = x
    return xx

  v_sy_to_vy: (yy) ->
    canvas_height = @get('height')
    # Note: +1 to account for 1px canvas dilation
    for y, idx in yy
      yy[idx] = canvas_height - (y + 1)
    return yy

  _set_width: (width, update=true) ->
    if @_width_constraint?
      @solver.remove_constraint(@_width_constraint)
    @_width_constraint = new Constraint(new Expression(@_width, -width), Operator.Eq)
    @solver.add_constraint(@_width_constraint)
    if update
      @solver.update_variables()
    @new_bounds = true

  _set_height: (height, update=true) ->
    if @_height_constraint?
      @solver.remove_constraint(@_height_constraint)
    @_height_constraint = new Constraint(new Expression(@_height, -height), Operator.Eq)
    @solver.add_constraint(@_height_constraint)
    if update
      @solver.update_variables()
    @new_bounds = true

  _set_dims: (dims, trigger=true) ->
    @_set_width(dims[0], false)
    @_set_height(dims[1], false)
    @solver.update_variables(trigger)

  defaults: ->
    return _.extend {}, super(), {
      width: 300
      height: 300
      map: false
      mousedown_callbacks: []
      mousemove_callbacks: []
      use_hidpi: true
    }

module.exports =
  Model: Canvas