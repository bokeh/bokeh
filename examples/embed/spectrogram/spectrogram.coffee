
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

  constructor: (layout) ->
    @request_data = _.throttle((=> @_request_data()), 20)
    @paused = false
    @gain = 20

    @spectrogram_plot = new SpectrogramPlot(find(layout, "spectrogram"))
    @signal_plot = new SimpleIndexPlot(find(layout, "signal"))
    @power_plot = new SimpleIndexPlot(find(layout, "spectrum"))
    #@eq_plot = new RadialHistogramPlot(find(layout, "eq"))

    setInterval((() => @request_data()), 400)

  _request_data: () ->
    if @paused
      return

    $.ajax('http://localhost:5000/data', {
      type: 'GET'
      dataType: 'json'
      cache: false
      error: (jqXHR, textStatus, errorThrown) =>
        null
      success: (data, textStatus, jqXHR) =>
        @on_data(data)
      complete: (jqXHR, status) =>
        requestAnimationFrame(() => @request_data())
    })

  on_data: (data) ->
    signal = (x*@gain for x in data.signal)
    spectrum = (x*@gain for x in data.spectrum)
    power = (x*x for x in data.spectrum)

    @spectrogram_plot.update(spectrum)
    @signal_plot.update(signal)
    @power_plot.update(power)
    #@eq_plot.update(data.bins)

SPECTROGRAM_LENGTH = 512
NGRAMS = 800
TILE_WIDTH = 500

class SpectrogramPlot

  constructor: (@model) ->
    @source = @model.get('data_source')
    @cmap = new Bokeh.LinearColorMapper.Model({
      palette: Bokeh.Palettes.all_palettes["YlGnBu-9"], low: 0, high: 10
    })

    @num_images = Math.ceil(NGRAMS/TILE_WIDTH) + 3

    @image_width = TILE_WIDTH

    @images = new Array(@num_images)
    for i in [0..(@num_images-1)]
      @images[i] = new ArrayBuffer(SPECTROGRAM_LENGTH * @image_width * 4)

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

    for i in [0...SPECTROGRAM_LENGTH]
      image32[i*@image_width+@col] = buf32[i]

    @source.set('data', {image: @images, x: @xs})
    @source.trigger('change', @source)

  set_yrange: (y0, y1) ->
    @view.y_range.set({'start': y0, 'end' : y1})

class RadialHistogramPlot

  constructor: (@model) ->
    @source = @model.get('data_source')

  update: (bins) ->
    angle = 2*Math.PI/bins.length
    [inner, outer, start, end, alpha] = [[], [], [], [], []]
    for i in [0...bins.length]
      range = [0...bins[i]]
      inner = inner.concat(i+2 for i in range)
      outer = outer.concat(i+2.95 for i in range)
      start = start.concat((i+0.05) * angle for i in range)
      end   = end.concat((i+95) * angle for i in range)
      alpha = alpha.concat(1 - 0.08*i for i in range)

    @source.set('data', {
      inner_radius: inner, outer_radius: outer, start_angle: start, end_angle: end, fill_alpha: alpha
    })
    @source.trigger('change', @source)

class SimpleIndexPlot

  constructor: (@model) ->
    @source = @model.get('data_source')
    plot = @model.attributes.parent
    @x_range = plot.get('frame').get('x_ranges')[@model.get('x_range_name')]

  update: (y) ->
    start = @x_range.get('start')
    end = @x_range.get('end')
    idx = (start + (i/y.length)*end for i in [0...y.length])

    @source.set('data', {idx: idx, y: y})
    @source.trigger('change', @source)

  set_xrange: (x0, x1) ->
    @x_range.set({'start': x0, 'end' : x1})

setup = () ->
  index = window.Bokeh.index
  if _.keys(index).length == 0
    console.log "Bokeh not loaded yet, waiting to set up SpectrogramApp..."
    setTimeout(setup, 200)
  else
    console.log "Bokeh loaded, starting SpectrogramApp"
    id = _.keys(index)[0]
    app = new SpectrogramApp(index[id].model)

setTimeout(setup, 200)

