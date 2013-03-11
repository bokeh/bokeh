Collections = require('base').Collections

NUM_SAMPLES = 1024
SAMPLING_RATE = 44100
MAX_FREQ = SAMPLING_RATE / 2
FREQ_SAMPLES = NUM_SAMPLES / 8
SPECTROGRAM_LENGTH = 512

NGRAMS = 1620

TIMESLICE = 50 # ms

class Spectrogram
  constructor: () ->
    @canvas_width = NGRAMS
    @canvas_height = 512

    @y = [0]
    @dh = [NGRAMS]
    @image = [new Float32Array(SPECTROGRAM_LENGTH * NGRAMS)]
    @power = [new Float32Array(NUM_SAMPLES)]
    @idx = [new Array(NUM_SAMPLES)]

    @data_source = Collections('ColumnDataSource').create(
      data: {image: @image, power: @power, idx: @idx}
    )
    for i in [0..@idx[0].length-1]
      @idx[0][i] = (i/(@idx[0].length-1))*TIMESLICE

    spec_model = @create_spec()
    @spec_view = new @plot_model.default_view(model: spec_model)

    power_model = @create_power()
    @power_view = new @plot_model.default_view(model: power_model)

    @render()

  request_data: () =>
    $.ajax 'http://localhost:5000/data',
    type: 'GET'
    dataType: 'json'
    error: (jqXHR, textStatus, errorThrown) =>
      console.log "AJAX Error: #{textStatus}"
    success: (data, textStatus, jqXHR) =>
      @on_data(data)

  on_data: (data) =>
    if not data[0]?
      return
    for i in [0..(SPECTROGRAM_LENGTH-1)]
      for j in [(NGRAMS-1)..1]
        @image[0][i*NGRAMS + j] = @image[0][i*NGRAMS + j - 1]
      @image[0][i*NGRAMS] = data[0][i]
    for i in [0..@power[0].length-1]
      @power[0][i] = data[1][i]
    @data_source.set('data', {image: @image, power: @power, idx: @idx})
    @data_source.trigger('change', @data_source, {})

  render: () ->
    div = $('<div></div>')
    $('body').append(div)
    myrender  =  =>
      div.append(@spec_view.$el)
      @spec_view.render()
      div.append(@power_view.$el)
      @power_view.render()
    _.defer(myrender)

  create_spec: () ->
    @plot_model = Collections('Plot').create()

    xrange = Collections('Range1d').create({start: 0, end: NGRAMS})
    yrange = Collections('Range1d').create({start: 0, end: MAX_FREQ})

    xaxis = Collections('LinearAxis').create(
      orientation: 'bottom'
      parent: @plot_model.ref()
      data_range: xrange.ref()
    )
    yaxis = Collections('LinearAxis').create(
      orientation: 'left'
      parent: @plot_model.ref()
      data_range: yrange.ref()
    )

    glyphspec = {
      type: 'image'
      x: 0
      y: 0
      dw: NGRAMS
      dh: MAX_FREQ
      width: NGRAMS,
      height: SPECTROGRAM_LENGTH,
      image: 'image'
      palette:
        default: 'YlGnBu-9'
    }
    glyph = Collections('GlyphRenderer').create({
        data_source: @data_source.ref()
        xdata_range: xrange.ref()
        ydata_range: yrange.ref()
        glyphspec: glyphspec
      })

    @plot_model.set(
      renderers: [glyph.ref()]
      axes: [xaxis.ref(), yaxis.ref()]
      tools: []
      width: @canvas_width
      height: @canvas_height
    )

  create_power: () ->
    @plot_model = Collections('Plot').create()

    xrange = Collections('Range1d').create({start: 0, end: TIMESLICE})
    yrange = Collections('Range1d').create({start: -0.25, end: 0.25})

    xaxis = Collections('LinearAxis').create(
      orientation: 'bottom'
      parent: @plot_model.ref()
      data_range: xrange.ref()
    )
    yaxis = Collections('LinearAxis').create(
      orientation: 'left'
      parent: @plot_model.ref()
      data_range: yrange.ref()
    )

    glyphspec = {
      type: 'line',
      xs: 'idx'
      ys: 'power'
    }
    glyph = Collections('GlyphRenderer').create({
        data_source: @data_source.ref()
        xdata_range: xrange.ref()
        ydata_range: yrange.ref()
        glyphspec: glyphspec
      })

    @plot_model.set(
      renderers: [glyph.ref()]
      axes: [xaxis.ref(), yaxis.ref()]
      tools: []
      width: @canvas_width
      height: 200
    )

$(document).ready () ->
  spec = new Spectrogram()
  setInterval(spec.request_data, TIMESLICE)

