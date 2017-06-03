import * as p from "core/properties"
import {Renderer, RendererView} from "models/renderers/renderer"
import {LinearColorMapper} from "models/mappers/linear_color_mapper"

export class WaterfallRendererView extends RendererView
  initialize: (options) ->
    super(options)

    N = Math.ceil(@model.num_grams/@model.tile_width) + 1
    [w, h] = [@model.tile_width, @model.gram_length]

    @image = []
    @canvas = []
    for i in [0...N]
      canvas = document.createElement('canvas')
      [canvas.width, canvas.height] = [w, h]
      @canvas.push(canvas)
      @image.push(new Uint32Array(w*h))

    @x = new Array(N)
    for i in [0...N]
      @x[i] = -@model.num_grams + @model.tile_width*(i-1)

    [@col, @tile] = [0, 0]
    @cmap = new LinearColorMapper({'palette': @model.palette, low: 0, high: 5})
    @xscale = @plot_view.frame.xscales['default']
    @yscale = @plot_view.frame.yscales['default']
    @max_freq = @plot_view.frame.y_range.end

    @connect(@model.change, @request_render)

  render: () ->
    ctx = @plot_view.canvas_view.ctx

    for i in [0...@x.length]
      @x[i] += 1

    @col -= 1
    if @col < 0
      @col = @model.tile_width - 1
      @tile -= 1
      if @tile < 0
        @tile = @x.length - 1
      @x[@tile] = -@model.tile_width

    buf32 = new Uint32Array(@cmap.v_map_screen(@model.latest))
    for i in [0...@model.gram_length]
      @image[@tile][i*@model.tile_width+@col] = buf32[i]

    sx = @plot_view.canvas.v_vx_to_sx(@xscale.v_map_to_target(@x))
    sy = @plot_view.canvas.vy_to_sy(@yscale.map_to_target(0))
    sw = Math.ceil(@xscale.map_to_target(@model.tile_width) - @xscale.map_to_target(0))
    sh = Math.ceil(@yscale.map_to_target(@max_freq))

    ctx.save()

    smoothing = ctx.getImageSmoothingEnabled()
    ctx.setImageSmoothingEnabled(false)

    ctx.translate(0, sy)
    ctx.scale(1, -1)
    ctx.translate(0, -sy)

    for i in [0...sx.length]
      if i == @tile
        cctx = @canvas[i].getContext('2d')
        image = cctx.getImageData(0, 0, @model.tile_width, @model.gram_length)
        image.data.set(new Uint8Array(@image[i].buffer))
        cctx.putImageData(image, 0, 0)
      ctx.drawImage(@canvas[i], sx[i], sy, sw, sh)

    ctx.translate(0, sy)
    ctx.scale(1, -1)
    ctx.translate(0, -sy)

    ctx.setImageSmoothingEnabled(smoothing)

    ctx.restore()

export class WaterfallRenderer extends Renderer
  type: 'WaterfallRenderer'
  default_view: WaterfallRendererView
  @define {
    latest:      [ p.Any ]
    palette:     [ p.Any ]
    num_grams:   [ p.Int ]
    gram_length: [ p.Int ]
    tile_width:  [ p.Int ]
  }
  @override { level: "glyph" }
