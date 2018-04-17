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

    ctx.save()

    smoothing = ctx.getImageSmoothingEnabled()
    ctx.setImageSmoothingEnabled(false)

    @_update_tiles()

    sx = @xscale.v_compute(@x)
    sy = @yscale.compute(0)
    sw = Math.ceil(@xscale.compute(@model.tile_width) - @xscale.compute(0))
    sh = Math.ceil(@yscale.compute(0) - @yscale.compute(@max_freq))

    ctx.translate(0, sy)
    ctx.scale(1, -1)
    ctx.translate(0, -sy)

    for i in [0...sx.length]
      ctx.drawImage(@canvas[i], sx[i], sy, sw, sh)

    ctx.translate(0, sy)
    ctx.scale(1, -1)
    ctx.translate(0, -sy)

    ctx.setImageSmoothingEnabled(smoothing)

    ctx.restore()

  _update_tiles: () ->
    # shift all tiles to the right by one
    for i in [0...@x.length]
      @x[i] += 1

    # if we've updated the last column in the current tile, move to the next tile
    # in the buffer (rotating the buffer if necessary)
    @col -= 1
    if @col < 0
      @col = @model.tile_width - 1
      @tile -= 1
      if @tile < 0
        @tile = @x.length - 1
      @x[@tile] = -@model.tile_width

    # apply the lastest column to the current tile image
    buf32 = new Uint32Array(@cmap.rgba_mapper.v_compute(@model.latest).buffer)
    for i in [0...@model.gram_length]
      @image[@tile][i*@model.tile_width+@col] = buf32[i]

    # update the tiles canvas with the image data
    cctx = @canvas[@tile].getContext('2d')
    image = cctx.getImageData(0, 0, @model.tile_width, @model.gram_length)
    image.data.set(new Uint8Array(@image[@tile].buffer))
    cctx.putImageData(image, 0, 0)

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
