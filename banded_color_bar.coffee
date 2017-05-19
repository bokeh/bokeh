ColorBar = require "models/annotations/color_bar"
LinearColorMapper = require "models/mappers/linear_color_mapper"
p = require "core/properties"

class BandedColorBarView extends ColorBar.View
  bind_bokeh_events: () ->
    @listenTo(@model, 'change:band_start', () ->
      @_set_canvas_image()
      @plot_view.request_render())
    @listenTo(@model, 'change:band_end', () ->
      @_set_canvas_image()
      @plot_view.request_render())

  _set_canvas_image: () ->
    palette = @model.color_mapper.palette

    if @model.orientation == 'vertical'
      palette = palette.slice(0).reverse()

    switch @model.orientation
      when "vertical" then [w, h] = [1, palette.length]
      when "horizontal" then [w, h] = [palette.length, 1]

    canvas = document.createElement('canvas')
    [canvas.width, canvas.height] = [w, h]
    image_ctx = canvas.getContext('2d')
    image_data = image_ctx.getImageData(0, 0, w, h)

    # We always want to draw the entire palette linearly, so we create a new
    # LinearColorMapper instance and map a monotonic range of values with
    # length = palette.length to get each palette color in order.

    # if unset will be undefined and by handled by mapper, i think
    mapper = @model._tick_coordinate_mapper(palette.length)

    if @model.band_start?
      high = palette.length - mapper.map_to_target(@model.band_start)
    if @model.band_end?
      low = palette.length - mapper.map_to_target(@model.band_end)

    cmap = new LinearColorMapper.Model({
      palette: palette
      low: low
      high: high
    })

    buf = cmap.v_map_screen([0...palette.length])
    buf8 = new Uint8ClampedArray(buf)
    image_data.data.set(buf8)
    image_ctx.putImageData(image_data, 0, 0)

    @image = canvas

class BandedColorBar extends ColorBar.Model
  default_view: BandedColorBarView
  type: 'BandedColorBar'

  @internal {
    band_start: [ p.Number ]
    band_end:   [ p.Number ]
  }

module.exports =
  Model: BandedColorBar
  View: BandedColorBarView
