Collections = require('base').Collections

all_palettes = require('../palettes/palettes').all_palettes
ColorMapper = require('../mappers/color/linear_color_mapper').LinearColorMapper

NUM_SAMPLES = 1024
SAMPLING_RATE = 44100
MAX_FREQ = SAMPLING_RATE / 2
FREQ_SAMPLES = NUM_SAMPLES / 8
SPECTROGRAM_LENGTH = 512

FREQ_SLIDER_FACTOR = 2
FREQ_SLIDER_MAX = MAX_FREQ/FREQ_SLIDER_FACTOR
FREQ_SLIDER_MIN = 0

BORDER = 50

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


class SpectrogramApp
  constructor: () ->

    @gain = GAIN_DEFAULT
    @last_render = new Date()

    @paused = false
    @throttled_request_data = _.throttle((=> @request_data()), 40)
    # Set up image plot for the spectrogram
    @image_width = NGRAMS
    @image_height = 256
    @image = [new ArrayBuffer(SPECTROGRAM_LENGTH * NGRAMS * 4)]
    @spec_source = Collections('ColumnDataSource').create(
      data:{image: @image}
    )
    spec_model = @create_spec()
    @spec_view = new spec_model.default_view(model: spec_model)

    @power_plot = new SimpleIndexPlot({
      x0: 0, x1: window.TIMESLICE, y0: -0.5, y1: 0.5, width: 550, height: 220, border: BORDER
    })

    @fft_plot = new SimpleIndexPlot({
      x0: FREQ_SLIDER_MIN, x1: FREQ_SLIDER_MAX, y0: -1, y1: 10, width: 550, height: 220, border: BORDER
    })

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

    cmap = new ColorMapper({}, {
      palette: all_palettes["YlGnBu-9"],
      low: 0,
      high: 10
    })
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

    # update the simple line plots
    @power_plot.update(data[1])
    @fft_plot.update(data[0][0..data[0].length/FREQ_SLIDER_FACTOR])

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
    @fft_plot.set_xrange(min, max)
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
      min: FREQ_SLIDER_MIN
      max: FREQ_SLIDER_MAX
      values: [FREQ_SLIDER_MIN, FREQ_SLIDER_MAX]
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
    myrender = () =>
      div.append(@spec_view.$el)
      @spec_view.render()

      foo = $('<div></div>')
      foo.append(@power_plot.view.$el)
      foo.append(@fft_plot.view.$el)
      foo.css('float', 'left')
      div.append(foo)
      @power_plot.render()
      @fft_plot.render()

      div.append(@hist_view.$el)
      @hist_view.render()
      @hist_view.$el.css('float', 'left')
    _.defer(myrender)

  create_spec: () ->

    xrange = Collections('Range1d').create({start: 0, end: NGRAMS})
    yrange = Collections('Range1d').create({start: 0, end: MAX_FREQ})

    plot_model = Collections('Plot').create(
      x_range: xrange
      y_range: yrange
      border_fill: "#fff"
      canvas_width: @image_width + 2*BORDER
      canvas_height: @image_height + 2*BORDER
      outer_width: @image_width + 2*BORDER
      outer_height: @image_height + 2*BORDER
      border: BORDER
      tools: []
    )

    xaxis = Collections('GuideRenderer').create(
      guidespec: {
        type: 'linear_axis'
        dimension: 0
        location: 'min'
        bounds: 'auto'
      }
      parent: plot_model.ref()
    )
    yaxis = Collections('GuideRenderer').create(
      guidespec: {
        type: 'linear_axis'
        dimension: 1
        location: 'min'
        bounds: 'auto'
      }
      parent: plot_model.ref()
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
    plot_model.add_renderers([glyph, xaxis, yaxis])

    return plot_model


  create_hist: () ->
    plot_model = Collections('Plot').create()

    range = Collections('Range1d').create({start: -20, end: 20})

    plot_model = Collections('Plot').create(
      x_range: range
      y_range: range
      border_fill: "#fff"
      canvas_width: 500
      canvas_height: 500
      outer_width: 500
      outer_height: 500
      tools: []
    )

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
    plot_model.add_renderers([glyph])

    return plot_model


class SimpleIndexPlot
  constructor: (options) ->
    @source = Collections('ColumnDataSource').create(
      data: {idx: [[]], ys: [[]]}
    )

    @xrange = Collections('Range1d').create({start: options.x0, end: options.x1})
    @yrange = Collections('Range1d').create({start: options.y0, end: options.y1})

    @model = Collections('Plot').create(
      x_range: @xrange
      y_range: @yrange
      border_fill: "#fff"
      canvas_width:  options.width  + 2*options.border
      canvas_height: options.height + 2*options.border
      outer_width:   options.width  + 2*options.border
      outer_height:  options.height + 2*options.border
      tools: []
    )

    xaxis = Collections('GuideRenderer').create(
      guidespec: {
        type: 'linear_axis'
        dimension: 0
        location: 'min'
        bounds: 'auto'
      }
      parent: @model
    )

    yaxis = Collections('GuideRenderer').create(
      guidespec: {
        type: 'linear_axis'
        dimension: 1
        location: 'min'
        bounds: 'auto'
      }
      parent: @model
    )

    glyph = Collections('GlyphRenderer').create({
      data_source: @source
      xdata_range: @xrange
      ydata_range: @yrange
      glyphspec: {
        type: 'line'
        xs: 'idx'
        ys: 'ys'
      }
    })

    @model.add_renderers([glyph, xaxis, yaxis])
    @view = new @model.default_view(model: @model)

  update: (ys) ->
    if @idx?.length != ys.length
      @idx = new Array(ys.length)
      for i in [0..@idx.length-1]
        @idx[i] = @xrange.get('start') + (i/@idx.length)*@xrange.get('end')

    @source.set('data', {idx: [@idx], ys: [ys]})
    @source.trigger('change', @source, {})

  set_xrange: (x0, x1) ->
    @xrange.set({'start': x0, 'end' : x1})

  set_yrange: (y0, y1) ->
    @yrange.set({'start': x0, 'end' : x1})

  render: () ->
    @view.render()





$(document).ready () ->
  spec = new SpectrogramApp()
  setInterval((() ->
    spec.request_data()),
    400)


