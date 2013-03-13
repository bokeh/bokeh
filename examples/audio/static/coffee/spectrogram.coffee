Collections = require('base').Collections

NUM_SAMPLES = 1024
SAMPLING_RATE = 44100
MAX_FREQ = SAMPLING_RATE / 2
FREQ_SAMPLES = NUM_SAMPLES / 8
SPECTROGRAM_LENGTH = 512

NGRAMS = 1020

HISTSIZE = 256
NUM_BINS = 16

TIMESLICE = 35 # ms

GAIN_DEFAULT = 1
GAIN_MIN = 1
GAIN_MAX = 20

class Spectrogram
  constructor: () ->

    @gain = GAIN_DEFAULT

    # Set up image plot for the spectrogram
    @image_width = NGRAMS
    @image_height = SPECTROGRAM_LENGTH
    @image = [new Float32Array(SPECTROGRAM_LENGTH * NGRAMS)]
    @spec_source = Collections('ColumnDataSource').create(
      data:{image: @image}
    )
    spec_model = @create_spec()
    @spec_view = new spec_model.default_view(model: spec_model)

    # Set up the power waveform plot
    @power = [new Float32Array(NUM_SAMPLES)]
    @power_idx = [new Array(NUM_SAMPLES)]
    for i in [0..@power_idx[0].length-1]
      @power_idx[0][i] = (i/(@power_idx[0].length-1))*TIMESLICE
    @power_source = Collections('ColumnDataSource').create(
      data:{power: @power, idx: @power_idx}
    )
    power_model = @create_power()
    @power_view = new power_model.default_view(model: power_model)

    # Set up the single FFT plot
    @fft = [new Float32Array(SPECTROGRAM_LENGTH)]
    @fft_idx = [new Array(SPECTROGRAM_LENGTH)]
    for i in [0..@fft_idx[0].length-1]
      @fft_idx[0][i] = i
    @fft_source = Collections('ColumnDataSource').create(
      data:{fft: @fft, idx: @fft_idx}
    )
    fft_model = @create_fft()
    @fft_view = new fft_model.default_view(model: fft_model)

    # Set up the radial histogram
    @hist_source = Collections('ColumnDataSource').create(
      data: {inner_radius:[], outer_radius:[], start_angle:[], end_angle:[], fill_alpha: []}
    )
    hist_model = @create_hist()
    @hist_view = new hist_model.default_view(model: hist_model)

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

    # apply the gain
    for i in [0..(data[0].length-1)]
      data[0][i] *= @gain
    for i in [0..(data[1].length-1)]
      data[1][i] *= @gain

    # update the spectrogram
    for i in [0..(SPECTROGRAM_LENGTH-1)]
      for j in [(NGRAMS-1)..1]
        @image[0][i*NGRAMS + j] = @image[0][i*NGRAMS + j - 1]
      @image[0][i*NGRAMS] = data[0][i]
    @spec_source.set('data', {image: @image})
    @spec_source.trigger('change', @spec_source, {})

    # update the power waveform data
    for i in [0..@power[0].length-1]
      @power[0][i] = data[1][i]
    @power_source.set('data', {power: @power, idx: @power_idx})
    @power_source.trigger('change', @power_source, {})

    # update the single fft data
    for i in [0..@fft[0].length-1]
      @fft[0][i] = data[0][i]
    @fft_source.set('data', {fft: @fft, idx: @fft_idx})
    @fft_source.trigger('change', @fft_source, {})

    # update the radial histogram data
    hist = new Float32Array(NUM_BINS)
    bin_start = 0
    bin_size = Math.ceil(HISTSIZE / NUM_BINS)
    for i in [0..NUM_BINS-1]
      hist[i] = 0
      bin_end = Math.min(bin_start+bin_size-1, data[0].length)
      for j in [bin_start..bin_end]
        hist[i] += data[0][j]
      bin_start += bin_size

    inner = []
    outer = []
    start = []
    end = []
    fill_alpha = []
    vals = []
    angle = 2*Math.PI/NUM_BINS
    for i in [0..(hist.length-1)]
      n = hist[i]/16
      for j in [0..n]
        vals.push(j)
        inner.push(2+j)
        outer.push(2+j+0.95)
        start.push((i+0.05)*angle)
        end.push((i+0.95)*angle)
        fill_alpha.push(1-0.08*j)

    @hist_source.set('data', {
      inner_radius: inner, outer_radius: outer, start_angle: start, end_angle: end, fill_alpha: fill_alpha
    })
    @hist_source.trigger('change', @power_source, {})

  render: () ->
    slider_div = $('<div id="gain-slider" style="margin: 50px; width: 200px;"></div>')
    slider_div.slider({
      animate: "fast",
      step: 0.1
      min: GAIN_MIN,
      max: GAIN_MAX,
      value: GAIN_DEFAULT,
      slide: ( event, ui ) =>
        $( "#gain" ).val( ui.value );
        @gain = ui.value
    });
    $( "#gain" ).val( $( "#gain-slider" ).slider( "value" ) );
    $('body').append(slider_div)
    div = $('<div></div>')
    $('body').append(div)
    myrender  =  =>
      div.append(@spec_view.$el)
      @spec_view.render()

      span = $('<span></span>').append(@power_view.$el)
      div.append(span)
      @power_view.render()

      span = $('<span></span>').append(@fft_view.$el)
      div.append(span)
      @fft_view.render()

      span = $('<span></span>').append(@hist_view.$el)
      div.append(span)
      @hist_view.render()

    _.defer(myrender)

  create_spec: () ->
    plot_model = Collections('Plot').create()

    xrange = Collections('Range1d').create({start: 0, end: NGRAMS})
    yrange = Collections('Range1d').create({start: 0, end: MAX_FREQ})

    xaxis = Collections('LinearAxis').create(
      orientation: 'bottom'
      parent: plot_model.ref()
      data_range: xrange.ref()
    )
    yaxis = Collections('LinearAxis').create(
      orientation: 'left'
      parent: plot_model.ref()
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
      data_source: @spec_source.ref()
      xdata_range: xrange.ref()
      ydata_range: yrange.ref()
      glyphspec: glyphspec
    })

    plot_model.set(
      renderers: [glyph.ref()]
      axes: [xaxis.ref(), yaxis.ref()]
      tools: []
      width: @image_width
      height: @image_height
    )

    return plot_model

  create_power: () ->
    plot_model = Collections('Plot').create()

    xrange = Collections('Range1d').create({start: 0, end: TIMESLICE})
    yrange = Collections('Range1d').create({start: -0.25, end: 0.25})

    xaxis = Collections('LinearAxis').create(
      orientation: 'bottom'
      parent: plot_model.ref()
      data_range: xrange.ref()
    )
    yaxis = Collections('LinearAxis').create(
      orientation: 'left'
      parent: plot_model.ref()
      data_range: yrange.ref()
    )

    glyphspec = {
      type: 'line'
      xs: 'idx'
      ys: 'power'
    }
    glyph = Collections('GlyphRenderer').create({
      data_source: @power_source.ref()
      xdata_range: xrange.ref()
      ydata_range: yrange.ref()
      glyphspec: glyphspec
    })

    plot_model.set(
      renderers: [glyph.ref()]
      axes: [xaxis.ref(), yaxis.ref()]
      tools: []
      width: @image_width
      height: 200
    )

    return plot_model

  create_fft: () ->
    plot_model = Collections('Plot').create()

    xrange = Collections('Range1d').create({start: 0, end: SPECTROGRAM_LENGTH})
    yrange = Collections('Range1d').create({start: -1.75, end: 1.75})

    xaxis = Collections('LinearAxis').create(
      orientation: 'bottom'
      parent: plot_model.ref()
      data_range: xrange.ref()
    )
    yaxis = Collections('LinearAxis').create(
      orientation: 'left'
      parent: plot_model.ref()
      data_range: yrange.ref()
    )

    glyphspec = {
      type: 'line'
      xs: 'idx'
      ys: 'fft'
    }
    glyph = Collections('GlyphRenderer').create({
      data_source: @fft_source.ref()
      xdata_range: xrange.ref()
      ydata_range: yrange.ref()
      glyphspec: glyphspec
    })

    plot_model.set(
      renderers: [glyph.ref()]
      axes: [xaxis.ref(), yaxis.ref()]
      tools: []
      width: @image_width
      height: 200
    )

    return plot_model

  create_hist: () ->
    plot_model = Collections('Plot').create()

    range = Collections('Range1d').create({start: -20, end: 20})

    glyphspec = {
      type: 'annular_wedge',
      line_color: null
      x: 0
      y: 0
      fill: '#688AB9'
      fill_alpha: 'fill_alpha'
      inner_radius: 'inner_radius'
      outer_radius: 'outer_radius'
      start_angle: 'start_angle'
      end_angle: 'end_angle'
      direction: 'clock'
    }
    glyph = Collections('GlyphRenderer').create({
      data_source: @hist_source.ref()
      xdata_range: range.ref()
      ydata_range: range.ref()
      glyphspec: glyphspec
    })

    plot_model.set(
      renderers: [glyph.ref()]
      axes: []
      tools: []
      width: 500
      height: 500
    )

    return plot_model

$(document).ready () ->
  spec = new Spectrogram()
  setInterval(spec.request_data, TIMESLICE)

