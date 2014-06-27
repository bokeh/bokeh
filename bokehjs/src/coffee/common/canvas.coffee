define [
  "backbone",
  "common/continuum_view",
  "common/has_parent",
  "./canvas_template"
], (Backbone, ContinuumView, HasParent, canvas_template) ->

  class CanvasView extends ContinuumView.View

    className: "bokeh plotview"

    template: canvas_template

    events:
      "mousemove .bokeh_canvas_wrapper": "_mousemove"
      "mousedown .bokeh_canvas_wrapper": "_mousedown"

    initialize: (options) ->
      super(options)

      template_data = {
        map: @mget('map')
      }
      html = @template(template_data)
      @$el.html(html)

      @canvas_wrapper = @$el.find('.bokeh_canvas_wrapper')
      @canvas = @$el.find('canvas.bokeh_canvas')
      @map_div = @$el.find('.bokeh_gmap') ? null

    render: () ->
      @ctx = @canvas[0].getContext('2d')

      if @mget('use_hidpi')
        devicePixelRatio = window.devicePixelRatio || 1
        backingStoreRatio = @ctx.webkitBackingStorePixelRatio ||
                            @ctx.mozBackingStorePixelRatio ||
                            @ctx.msBackingStorePixelRatio ||
                            @ctx.oBackingStorePixelRatio ||
                            @ctx.backingStorePixelRatio || 1
        ratio = devicePixelRatio / backingStoreRatio
      else
        ratio = 1

      width = @mget('canvas_width')
      height = @mget('canvas_height')

      @canvas.width = width * @dpi_ratio
      @canvas.height = height * @dpi_ratio

      @canvas_wrapper.attr('style', "width:#{width}px; height:#{height}px")
      @canvas.attr('style', "width:#{width}px;")
      @canvas.attr('style', "height:#{height}px;")
      @canvas.attr('width', width*ratio).attr('height', height*ratio)
      @$el.attr("width", width).attr('height', height)

      @ctx.scale(ratio, ratio)
      @ctx.translate(0.5, 0.5)

      # work around canvas incompatibilities
      @_fixup_line_dash(@ctx)
      @_fixup_line_dash_offset(@ctx)
      @_fixup_image_smoothing(@ctx)
      @_fixup_measure_text(@ctx)

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
          # fake it 'til you make it
          textMetrics.ascent = ctx.html5MeasureText("m").width * 1.6
          return textMetrics

    _mousedown: (e) =>
      for f in @mget('mousedown_callbacks')
        f(e, e.layerX, e.layerY)

    _mousemove: (e) =>
      for f in @mget('mousemove_callbacks')
        f(e, e.layerX, e.layerY)

  class Canvas extends HasParent
    type: 'Canvas'
    default_view: CanvasView

    defaults: () ->
      return {
        canvas_width: 300
        canvas_height: 300
        map: false
        mousedown_callbacks: []
        mousemove_callbacks: []
        use_hidpi: true
      }

    display_defaults: () ->
      return { }

  class Canvases extends Backbone.Collection
    model: Canvas

  return {
    "Model": Canvas,
    "Collection": new Canvases(),
  }
