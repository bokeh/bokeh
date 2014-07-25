
class SpectrogramApp
  constructor: () ->
    @throttled_request_data = _.throttle((=> @request_data()), 40)

    @spectrum_plot = new SpectrogramPlot({ })
    @power_plot = new SimpleIndexPlot({ })
    @fft_plot = new SimpleIndexPlot({ })
    @rhist_plot = new RadialHistogramPlot({ )

  request_data: () ->
    if @paused
      return

    $.ajax('http://localhost:5000/data', {
      type: 'GET'
      dataType: 'json'
      error: (jqXHR, textStatus, errorThrown) =>
        'pass'
      success: (data, textStatus, jqXHR) =>
        if data[0]?
          @on_data(data)
        requestAnimationFrame(
          => @throttled_request_data())
    })

  on_data: (data) ->
    spectrum, power, bins = data

    for i in [0...power.length]
      power[i] *= @gain

    for i in [0...spectrum.length]
      spectrum[i] *= @gain

    @spectrum_plot.update(spectrum)
    @power_plot.update(power)
    @fft_plot.update(spectrum)
    @rhist_plot.update(bins)

class SpectrogramPlot
  constructor: (model) ->
    @cmap = new Bokeh.LinearColorMapper.Model({
      palette: Bokeh.all_palettes["YlGnBu-9"], low: 0, high: 10
    })
    @col

  update: (fft) ->
    buf = @cmap.v_map_screen(fft)

    for i in [0...xs.length]
      xs[i] += 1

    @col -= 1
    if @col == -1
      @col = @image_width - 1
      img = images.pop()
      images = [img].concat(images[0..])
      xs.pop()
      xs = [1-@image_width].concat(xs)

    image32 = new Uint32Array(images[0])
    buf32 = new Uint32Array(buf)

    for i in [0...SPECTROGRAM_LENGTH]
      image32[i*@image_width+@col] = buf32[i]

    @source.set('data', {image: images, x: xs})
    @source.trigger('change', @source)

  set_yrange: (y0, y1) ->
    @view.y_range.set({'start': y0, 'end' : y1})

class RadialHistogramPlot
  constructor: (model) ->
    @source

  update: (bins) ->
    angle = 2*Math.PI/bins.length
    inner, outer, start, end, alpha = [], [], [], [], []
    for i in [0...bins.length]
      n = bins[i]
      inner = inner.concat(i+2 for i in 0..n)
      outer = outer.concat(i+2.95 for i in 0..n)
      start = start.concat((i+0.05) * angle for i in 0..n)
      end   = end.concat((i+95) * angle for i in 0..n)
      alpha = alpha.concat(1 - 0.08*i for i in 0..n)

    @source.set('data', {
      inner_radius: inner, outer_radius: outer, start_angle: start, end_angle: end, fill_alpha: alpha
    })
    @source.trigger('change', @source)

class SimpleIndexPlot
  constructor: (model) ->
    @source

  update: (ys) ->
    start = @view.x_range.get('start')
    end = @view.x_range.get('end')
    idx = (start + (i/ys.length)*end for i in 0...ys.length)

    @source.set('data', {idx: idx, ys: ys})
    @source.trigger('change', @source)

  set_xrange: (x0, x1) ->
    @view.x_range.set({'start': x0, 'end' : x1})

  app = new SpectrogramApp()
  setInterval((() ->
    app.request_data()), 400
  )
