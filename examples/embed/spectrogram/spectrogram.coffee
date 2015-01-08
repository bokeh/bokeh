
# something like this will make it into Bokeh proper
find = (obj, name) ->
  if obj.get('name')? and obj.get('name') == name
    return obj
  if obj.get('children')?
    for c in obj.get('children')
      result = find(c, name)
      if result?
        return result
  if obj.get('renderers')?
    for r in obj.get('renderers')
      result = find(r, name)
      if result?
        return result
  return null

class SpectrogramApp

  constructor: (@layout) ->
    @paused = false
    @gain = 1

    @freq_slider = find(@layout, "freq")
    @freq_slider.on("change:value", @update_freq)
    @gain_slider = find(@layout, "gain")
    @gain_slider.on("change:value", @update_gain)

    config = $.ajax('http://localhost:5000/params', {
      type: 'GET'
      dataType: 'json'
      cache: false
    }).done((data, textStatus, jqXHR) =>
        @_config(data)
    ).then(@request_data)

  update_freq: () =>
    freq = @freq_slider.get('value')
    @spectrogram_plot.set_yrange(0, freq)
    @power_plot.set_xrange(0, freq)

  update_gain: () =>
    @gain = @gain_slider.get('value')

  _config: (data) ->
    @config = data
    console.log "Got config:", @config
    @spectrogram_plot = new SpectrogramPlot(find(@layout, "spectrogram"), @config)
    @signal_plot = new SimpleXYPlot(find(@layout, "signal"), @config)
    @power_plot = new SimpleXYPlot(find(@layout, "spectrum"), @config)
    @eq_plot = new RadialHistogramPlot(find(@layout, "eq"), @config)

  request_data: () =>
    in_flight = false
    helper = () =>
      if in_flight
        return
      in_flight = true
      $.ajax('/data',
        type: 'GET'
        dataType: 'json'
        cache: false
      ).fail(
        in_flight = false
      ).then((data) =>
        in_flight = false
        @on_data(data)
      )

    @interval = Math.floor(1000.0/@config.FRAMES_PER_SECOND)

    @thisTime = Date.now()
    @lastTime = Date.now()

    looper = () =>
      @thisTime = Date.now()
      @deltaTime = @thisTime - @lastTime
      delay = Math.max(@interval - @deltaTime, 0)
      timeout = setTimeout(looper, delay)
      @lastTime = @thisTime + delay
      helper()

    setTimeout(looper, 0)

  on_data: (data) ->
    if _.keys(data).length == 0
      return

    signal = (x*@gain for x in data.signal)
    spectrum = (x*@gain for x in data.spectrum)
    power = (x*x for x in data.spectrum)

    @spectrogram_plot.update(spectrum)

    t = (i/signal.length*@config.TIMESLICE for i in [0...signal.length])
    @signal_plot.update(t, signal)

    f = (i/spectrum.length*@config.MAX_FREQ for i in [0...spectrum.length])
    @power_plot.update(f, spectrum)

    @eq_plot.update(data.bins)

class SpectrogramPlot

  constructor: (@model, @config) ->
    @source = @model.get('data_source')
    @cmap = new Bokeh.LinearColorMapper.Model({
      palette: Bokeh.Palettes.YlGnBu9, low: 0, high: 5
    })

    plot = @model.attributes.parent
    @y_range = plot.get('frame').get('y_ranges')[@model.get('y_range_name')]

    @num_images = Math.ceil(@config.NGRAMS/@config.TILE_WIDTH) + 1

    @image_width = @config.TILE_WIDTH

    @images = new Array(@num_images)
    for i in [0..(@num_images-1)]
      @images[i] = new ArrayBuffer(@config.SPECTROGRAM_LENGTH * @image_width * 4)

    @xs = new Array(@num_images)

    @col = 0

  update: (spectrum) ->
    buf = @cmap.v_map_screen(spectrum)

    for i in [0...@xs.length]
      @xs[i] += 1

    @col -= 1
    if @col == -1
      @col = @image_width - 1
      img = @images.pop()
      @images = [img].concat(@images[0..])
      @xs.pop()
      @xs = [1-@image_width].concat(@xs[0..])

    image32 = new Uint32Array(@images[0])
    buf32 = new Uint32Array(buf)

    for i in [0...@config.SPECTROGRAM_LENGTH]
      image32[i*@image_width+@col] = buf32[i]

    @source.set('data', {image: @images, x: @xs})
    @source.trigger('change', @source)

  set_yrange: (y0, y1) ->
    @y_range.set({'start': y0, 'end' : y1})

class RadialHistogramPlot

  constructor: (@model, @config) ->
    @source = @model.get('data_source')

  update: (bins) ->
    angle = 2*Math.PI/bins.length
    [inner, outer, start, end, alpha] = [[], [], [], [], []]
    for i in [0...bins.length]
      range = [0...(Math.min(Math.ceil(bins[i]), @config.EQ_CLAMP))]
      inner = inner.concat(j+2 for j in range)
      outer = outer.concat(j+2.95 for j in range)
      start = start.concat((i+0.05) * angle for j in range)
      end   = end.concat((i+0.95) * angle for j in range)
      alpha = alpha.concat(1 - 0.08*j for j in range)

    @source.set('data', {
      inner_radius: inner, outer_radius: outer, start_angle: start, end_angle: end, fill_alpha: alpha
    })
    @source.trigger('change', @source)

class SimpleXYPlot

  constructor: (@model, @config) ->
    @source = @model.get('data_source')
    plot = @model.attributes.parent
    @x_range = plot.get('frame').get('x_ranges')[@model.get('x_range_name')]

  update: (x, y) ->
    @source.set('data', {x: x, y: y})
    @source.trigger('change', @source)

  set_xrange: (x0, x1) ->
    @x_range.set({'start': x0, 'end' : x1})

setup = () ->
  index = window.Bokeh.index
  keys = _.keys(index)
  if keys.length is 0
    console.log("Bokeh not loaded yet, waiting to set up SpectrogramApp...")
    return

  clearInterval(timer)

  console.log("Bokeh loaded, starting SpectrogramApp")
  id = keys[0]
  app = new SpectrogramApp(index[id].model)

timer = setInterval(setup, 100)



