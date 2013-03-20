Collections = require('base').Collections

all_palettes = require('../palettes/palettes').all_palettes
ColorMapper = require('../color_mapper').ColorMapper

NUM_SAMPLES = 1024
SAMPLING_RATE = 44100
MAX_FREQ = SAMPLING_RATE / 2
FREQ_SAMPLES = NUM_SAMPLES / 8
SPECTROGRAM_LENGTH = 512
FREQ_MAX = 512
FREQ_MIN = 0

NGRAMS = 1020

HISTSIZE = 256
NUM_BINS = 16

window.TIMESLICE = 40 # ms

GAIN_DEFAULT = 1
GAIN_MIN = 1
GAIN_MAX = 20
requestAnimationFrame = window.requestAnimationFrame || \
  window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||\
  window.msRequestAnimationFrame

class Spectrogram
  constructor: () ->

    @gain = GAIN_DEFAULT
    @last_render = new Date()

    @paused = false
    @throttled_request_data = _.throttle((=> @request_data()), 10)
    # Set up image plot for the spectrogram
    @image_width = NGRAMS
    @image_height = 256
    @image = [new ArrayBuffer(SPECTROGRAM_LENGTH * NGRAMS * 4)]
    @spec_source = Collections('ColumnDataSource').create(
      data:{image: @image}
    )
    spec_model = @create_spec()
    @spec_view = new spec_model.default_view(model: spec_model)

    # Set up the power waveform plot
    @power = [new Float32Array(NUM_SAMPLES)]
    @power_idx = [new Array(NUM_SAMPLES)]
    for i in [0..@power_idx[0].length-1]
      @power_idx[0][i] = (i/(@power_idx[0].length-1))*window.TIMESLICE
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

  request_data: () ->
    if @paused
      return
    $.ajax 'http://localhost:5000/data',
    type: 'GET'
    dataType: 'json'
    error: (jqXHR, textStatus, errorThrown) =>

      #console.log "AJAX Error: #{textStatus}"
    success: (data, textStatus, jqXHR) =>
      if not data[0]?
        _.delay((=> @throttled_request_data), 130)
      else  
        @on_data(data)
        requestAnimationFrame(
          => @throttled_request_data())


    new_render = new Date()
    #console.log("render_time", new_render - @last_render)
    @last_render = new_render

  on_data: (data) ->
    if not data[0]?
      return

    # apply the gain
    for i in [0..(data[0].length-1)]
      data[0][i] *= @gain
    for i in [0..(data[1].length-1)]
      data[1][i] *= @gain

    cmap = new ColorMapper(all_palettes["YlGnBu-9"], 0, 10)
    buf = cmap.v_map_screen(data[0])

    image32 = new Uint32Array(@image[0])
    buf32 = new Uint32Array(buf)

    # update the spectrogram
    for i in [0..(SPECTROGRAM_LENGTH-1)]
      for j in [(NGRAMS-1)..1]
        image32[i*NGRAMS + j] = image32[i*NGRAMS + j - 1]
      image32[i*NGRAMS] = buf32[i]
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
    if @fft_xrange
      bin_min = Math.round(@fft_xrange.get('start'))
      bin_max = Math.round(@fft_xrange.get('end'))
    else
      bin_min = 0
      bin_max = 256
    bin_start = bin_min
    bin_size = Math.ceil((bin_max - bin_min) / NUM_BINS)
    for i in [0..NUM_BINS-1]
      hist[i] = 0
      bin_end = Math.min(bin_start+bin_size-1, bin_max)
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

  set_freq_range : (event, ui) ->
    [min, max] = ui.values
    @fft_xrange.set({'start': min, 'end' : max})
    return null

  render: () ->
    controls = $('<div></div>')

    slider = $('<div></div>')
    label = $("<p style>frequency range:</p>")
    slider.append(label)
    slider_div = $('<div id="freq-range-slider" style="width: 200px;"></div>')
    slider_div.slider({
      animate: "fast",
      step: 1
      min: 0
      max: 512
      values: [0, 512]
      slide: ( event, ui ) =>
        @set_freq_range(event, ui)
    });
    slider.append(slider_div)
    slider.css('float', 'left')
    slider.css('margin', '30px')
    controls.append(slider)

    slider = $('<div></div>')
    slider.append($("<p>gain:</p>"))
    slider_div = $('<div id="gain-slider" style="width: 200px;"></div>')
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
    slider.append(slider_div)
    slider.css('float', 'left')
    slider.css('margin', '30px')
    controls.append(slider)

    button = $('<button id="pause">pause</button>')
    button.on("click", () =>
      if button.text() == 'pause'
        button.text('resume')
        @paused = true
      else
        button.text('pause')
        @paused = false
        @request_data())

    controls.append(button)

    controls.css('clear', 'both')
    controls.css('overflow', 'hidden')
    $( "#gain" ).val( $( "#gain-slider" ).slider( "value" ) );
    $('body').append(controls)

    div = $('<div></div>')
    $('body').append(div)
    myrender  =  =>
      div.append(@spec_view.$el)
      @spec_view.render()

      div.append(@power_view.$el)
      foo = $('<div></div>')
      @power_view.render()
      @fft_view.render()
      foo.append(@power_view.$el)
      foo.append(@fft_view.$el)
      foo.css('float', 'left')
      div.append(foo)
      div.append(@hist_view.$el)
      @hist_view.render()
      @hist_view.$el.css('float', 'left')
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
      type: 'image_rgba'
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

    xrange = Collections('Range1d').create({start: 0, end: window.TIMESLICE})
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
      width: 500
      height: 220
    )

    return plot_model

  create_fft: () ->
    plot_model = Collections('Plot').create()

    xrange = Collections('Range1d').create({start: 0, end: SPECTROGRAM_LENGTH})
    @fft_xrange = xrange
    yrange = Collections('Range1d').create({start: -1.75, end: 3.75})

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
      width: 500
      height: 220
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
  setInterval((() ->
    spec.request_data()),
    400)
    

