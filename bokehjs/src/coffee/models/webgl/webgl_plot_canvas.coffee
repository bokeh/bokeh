PlotCanvas = require "../plots/plot_canvas"
{logger} = require "../../core/logging"
webgl_glyphs = require "./glyphs"

# Notes on WebGL support:
# Glyps can be rendered into the original 2D canvas, or in a (hidden)
# webgl canvas that we create below. In this way, the rest of bokehjs
# can keep working as it is, and we can incrementally update glyphs to
# make them use GL.
#
# When the author or user wants to, we try to create a webgl canvas,
# which is saved on the ctx object that gets passed around during drawing.
# The presence (and not-being-false) of the ctx.glcanvas attribute is the
# marker that we use throughout that determines whether we have gl support.

global_gl_canvas = null

class WebGLPlotCanvasView extends PlotCanvas.View

  glyph_view_factory: (model, renderer) ->
    glyph_view = super(model, renderer)

    # Init gl (this should really be done anytime renderer is set,
    # and not done if it isn't ever set, but for now it only
    # matters in the unit tests because we build a view without a
    # renderer there)
    ctx = @canvas_view.ctx
    if ctx.glcanvas?
      cls = webgl_glyphs[model.type + 'GLGlyph']
      if cls?
        glyph_view.glglyph = new cls(ctx.glcanvas.gl, glyph_view)

    return glyph_view

  init_webgl: () ->
    ctx = @canvas_view.ctx

    # We use a global invisible canvas and gl context. By having a global context,
    # we avoid the limitation of max 16 contexts that most browsers have.
    glcanvas = global_gl_canvas
    if not glcanvas?
      global_gl_canvas = glcanvas = document.createElement('canvas')
      opts = {'premultipliedAlpha': true}  # premultipliedAlpha is true by default
      glcanvas.gl = glcanvas.getContext("webgl", opts) || glcanvas.getContext("experimental-webgl", opts)

    # If WebGL is available, we store a reference to the gl canvas on
    # the ctx object, because that's what gets passed everywhere.
    if glcanvas.gl?
      ctx.glcanvas = glcanvas
    else
      logger.warn('WebGL is not supported, falling back to 2D canvas.')
      # Do not set @canvas_view.ctx.glcanvas

  prepare_webgl: (ratio, frame_box) ->
    # Prepare WebGL for a drawing pass
    ctx = @canvas_view.ctx
    canvas = @canvas_view.get_canvas_element()
    if ctx.glcanvas
      # Sync canvas size
      ctx.glcanvas.width = canvas.width
      ctx.glcanvas.height = canvas.height
      # Prepare GL for drawing
      gl = ctx.glcanvas.gl
      gl.viewport(0, 0, ctx.glcanvas.width, ctx.glcanvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT)
      # Clipping
      gl.enable(gl.SCISSOR_TEST)
      flipped_top = ctx.glcanvas.height - ratio * (frame_box[1] + frame_box[3])
      gl.scissor(ratio * frame_box[0], flipped_top, ratio * frame_box[2], ratio * frame_box[3])
      # Setup blending
      gl.enable(gl.BLEND)
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE)  # premultipliedAlpha == true
      #gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE)  # Without premultipliedAlpha == false

  blit_webgl: (ratio) ->
    # This should be called when the ctx has no state except the HIDPI transform
    ctx = @canvas_view.ctx
    if ctx.glcanvas
      # Blit gl canvas into the 2D canvas. To do 1-on-1 blitting, we need
      # to remove the hidpi transform, then blit, then restore.
      # ctx.globalCompositeOperation = "source-over"  -> OK; is the default
      logger.debug('drawing with WebGL')
      ctx.restore()
      ctx.drawImage(ctx.glcanvas, 0, 0)
      # Set back hidpi transform
      ctx.save()
      ctx.scale(ratio, ratio)
      ctx.translate(0.5, 0.5)

class WebGLPlotCanvas extends PlotCanvas.Model
  type: 'WebGLPlotCanvas'
  default_view: WebGLPlotCanvasView

module.exports = {
  Model: WebGLPlotCanvas
  View: WebGLPlotCanvasView
}
