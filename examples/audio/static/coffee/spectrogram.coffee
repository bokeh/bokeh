Collections = require('base').Collections

NUM_SAMPLES = 1024
SAMPLING_RATE = 44100
MAX_FREQ = SAMPLING_RATE / 8
FREQ_SAMPLES = NUM_SAMPLES / 8
SPECTROGRAM_LENGTH = 512

NGRAMS = 600

class Spectrogram
  constructor: () ->
    @canvas_width = SPECTROGRAM_LENGTH
    @canvas_height = NGRAMS

    @y = [0]
    @dh = [NGRAMS]
    @image = [new Float32Array(SPECTROGRAM_LENGTH * @canvas_height)]

    @data_source = Collections('ColumnDataSource').create(
      data: {y: @y, dh: @dh, image: @image}
    )

    @glyphspec = @create_glyphspec()
    @plot_model = @create_plot()
    @plot_view = new @plot_model.default_view(model: @plot_model)

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
    console.log "FOOOOOOOOOO", data[0].length
    for i in [(@image[0].length-1)..SPECTROGRAM_LENGTH]
      @image[0][i] = @image[0][i-SPECTROGRAM_LENGTH]
    for i in [0..SPECTROGRAM_LENGTH-1]
      @image[0][i] = data[0][i]
    @data_source.set('data', {y: @y, dh: @dh, image: @image})
    @data_source.trigger('change', @data_source, {})

  render: () ->
    div = $('<div></div>')
    $('body').append(div)
    myrender  =  =>
      div.append(@plot_view.$el)
      @plot_view.render()
    _.defer(myrender)

  create_glyphspec: () ->
    glyphspec = {
      type: 'image',
      x: 0
      y: 'y'
      dw: MAX_FREQ
      dh: 'dh'
      width: @canvas_width,
      height: @canvas_height,
      image: 'image'
      palette:
        default: 'YlGnBu-9'
    }
    return glyphspec

  create_plot: () ->
    @plot_model = Collections('Plot').create()

    xrange = Collections('Range1d').create({start: 0, end: MAX_FREQ})
    yrange = Collections('Range1d').create({start: 0, end: NGRAMS})

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

    glyph = Collections('GlyphRenderer').create({
        data_source: @data_source.ref()
        xdata_range: xrange.ref()
        ydata_range: yrange.ref()
        glyphspec: @glyphspec
      })

    @plot_model.set(
      renderers: [glyph.ref()]
      axes: [xaxis.ref(), yaxis.ref()]
      tools: []
      width: @canvas_width
      height: @canvas_height
    )

$(document).ready () ->
  spec = new Spectrogram()
  setInterval(spec.request_data, 50)

