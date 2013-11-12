
Collections  = Bokeh.Collections
all_palettes = Bokeh.Palettes.all_palettes

NUM_SAMPLES = 1024
SAMPLING_RATE = 44100
MAX_FREQ = SAMPLING_RATE / 2
FREQ_SAMPLES = NUM_SAMPLES / 8
SPECTROGRAM_LENGTH = 512

window.TIMESLICE = 40 # ms

NGRAMS = 800

HIST_NUM_BINS = 16

FREQ_SLIDER_MAX = MAX_FREQ
FREQ_SLIDER_MIN = 0
FREQ_SLIDER_START = FREQ_SLIDER_MAX/2

GAIN_DEFAULT = 1
GAIN_MIN = 1
GAIN_MAX = 20

requestAnimationFrame = window.requestAnimationFrame || \
  window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||\
  window.msRequestAnimationFrame

class SpectrogramApp
  constructor: () ->

    @gain = GAIN_DEFAULT

    @paused = false

    @throttled_request_data = _.throttle((=> @request_data()), 40)

    @spec_plot = new SpectrogramPlot({ width: NGRAMS, height: SPECTROGRAM_LENGTH/2+80 })

    @power_plot = new SimpleIndexPlot({
      x0: 0, x1: window.TIMESLICE+0.1, y0: -0.6, y1: 0.7, width: 800, height: 250
    })

    @fft_plot = new SimpleIndexPlot({
      x0: FREQ_SLIDER_MIN, x1: FREQ_SLIDER_MAX, y0: -1, y1: 26, width: 800, height: 250
    })

    @hist_plot = new RadialHistogramPlot({
      num_bins: HIST_NUM_BINS, width: 500, height: 500
    })

    @render()

  request_data: () ->
    if @paused
      return
    $.ajax 'http://localhost:5000/data',
    type: 'GET'
    dataType: 'json'
    error: (jqXHR, textStatus, errorThrown) =>

    success: (data, textStatus, jqXHR) =>
      if not data[0]?
        _.delay((=> @throttled_request_data), 130)
      else
        @on_data(data)
        requestAnimationFrame(
          => @throttled_request_data())

  on_data: (data) ->
    # apply the gain
    for i in [0..(data[0].length-1)]
      data[0][i] *= @gain
    for i in [0..(data[1].length-1)]
      data[1][i] *= @gain

    @spec_plot.update(data[0])
    @power_plot.update(data[1])
    @fft_plot.update(data[0])
    @hist_plot.update(data[0], @fft_range[0], @fft_range[1])

  set_freq_range : (event, ui) ->
    [min, max] = @fft_range = ui.values
    @spec_plot.set_yrange(min, max)
    @fft_plot.set_xrange(min, max)
    return null

  render: () ->
    controls = $('<div></div>')

    button = $('<button id="pause">pause</button>')
    button.on("click", () =>
      if button.text() == 'pause'
        button.text('resume')
        @paused = true
      else
        button.text('pause')
        @paused = false
        @request_data())
    button.css('margin-top', '50px')
    controls.append(button)

    sliders = $('<div></div>')

    slider = $('<div></div>')
    label = $("<p>freq range:</p>")
    slider.append(label)
    slider_div = $('<div id="freq-range-slider" style="height: 160px;"></div>')
    slider_div.slider({
      orientation: "vertical",
      animate: "fast",
      step: 1,
      min: FREQ_SLIDER_MIN,
      max: FREQ_SLIDER_MAX,
      values: [FREQ_SLIDER_MIN, FREQ_SLIDER_MAX],
      slide: ( event, ui ) =>
        @set_freq_range(event, ui)
    });
    slider.append(slider_div)
    slider.css('float', 'left')
    slider.css('margin', '10px')
    sliders.append(slider)

    @fft_range = [FREQ_SLIDER_MIN, FREQ_SLIDER_MAX]

    slider = $('<div></div>')
    slider.append($("<p>gain:</p>"))
    slider_div = $('<div id="gain-slider" style="height: 160px;"></div>')
    slider_div.slider({
      orientation: "vertical",
      animate: "fast",
      step: 0.1,
      min: GAIN_MIN,
      max: GAIN_MAX,
      value: GAIN_DEFAULT,
      slide: ( event, ui ) =>
        $( "#gain" ).val( ui.value );
        @gain = ui.value
    });
    slider.append(slider_div)
    slider.css('float', 'left')
    slider.css('margin', '10px')
    sliders.append(slider)

    controls.append(sliders)
    controls.css('float', 'left')
    $( "#gain" ).val( $( "#gain-slider" ).slider( "value" ) );

    div = $('<div></div>')
    $('body').append(div)
    myrender = () =>
      top_div = $('<div></div>')
      top_div.append(controls)
      @spec_plot.view.$el.css('float', 'left')
      top_div.append(@spec_plot.view.$el)
      div.append(top_div)
      @spec_plot.render()

      foo = $('<div></div>')
      foo.append(@fft_plot.view.$el)
      foo.append(@power_plot.view.$el)
      foo.css('float', 'left')
      div.append(foo)
      @power_plot.render()
      @fft_plot.render()

      div.append(@hist_plot.view.$el)
      @hist_plot.view.$el.css('float', 'left')
      @hist_plot.render()
    _.defer(myrender)

class SpectrogramPlot
  constructor: (options) ->
    @cmap = new ColorMapper({}, {
      palette: all_palettes["YlGnBu-9"],
      low: 0,
      high: 10
    })

    @num_images = Math.ceil(NGRAMS/500) + 3

    @image_width = 500
    @image_height = 256

    @images = new Array(@num_images)
    @xs = new Array(@num_images)
    for i in [0..(@num_images-1)]
      @images[i] = new ArrayBuffer(SPECTROGRAM_LENGTH * @image_width * 4)
      @xs[i] = @image_width*i
    @source = Collections('ColumnDataSource').create(
      data:{image: @images, x: @xs}
    )

    @col = 0

    @xrange = Collections('Range1d').create({start: 0, end: NGRAMS})
    @yrange = Collections('Range1d').create({start: 0, end: MAX_FREQ})

    @model = Collections('Plot').create(
      x_range: @xrange.ref()
      y_range: @yrange.ref()
      border_fill: "#fff"
      canvas_width: options.width
      canvas_height: options.height
      outer_width: options.width
      outer_height: options.height
      tools: []
      title: ""
    )

    xaxis = Collections('GuideRenderer').create(
      plot: @model.ref()
      guidespec: {
        type: 'linear_axis'
        dimension: 0
      }
    )

    yaxis = Collections('GuideRenderer').create(
      plot: @model.ref()
      guidespec: {
        type: 'linear_axis'
        dimension: 1
      }
    )

    glyph = Collections('GlyphRenderer').create({
      data_source: @source.ref()
      xdata_range: @xrange.ref()
      ydata_range: @yrange.ref()
      glyphspec: {
        type: 'image_rgba'
        x: 'x'
        y: 0
        dw: @image_width
        dh: MAX_FREQ
        width: @image_width,
        height: SPECTROGRAM_LENGTH,
        image: 'image'
        palette:
          default: 'YlGnBu-9'
      }
    })
    @model.add_renderers([glyph.ref(), xaxis.ref(), yaxis.ref()])
    @view = new @model.default_view(model: @model)

  update: (fft) ->
    buf = @cmap.v_map_screen(fft)

    @col -= 1
    for i in [0..(@num_images-1)]
      @xs[i] += 1

    if @col == -1
      @col = @image_width - 1
      img = @images.pop()
      @images = [img].concat(@images[0..])
      @xs.pop()
      @xs = [-@image_width+1].concat(@xs)

    image32 = new Uint32Array(@images[0])
    buf32 = new Uint32Array(buf)

    for i in [0..(SPECTROGRAM_LENGTH-1)]
      image32[i*@image_width+@col] = buf32[i]

    @source.set('data', {image: @images, x: @xs})
    @source.trigger('change', @source, {})

  set_xrange: (x0, x1) ->
    @xrange.set({'start': x0, 'end' : x1})

  set_yrange: (y0, y1) ->
    @yrange.set({'start': y0, 'end' : y1})

  render: () ->
    @view.render()

class RadialHistogramPlot
  constructor: (options) ->
    @num_bins = options.num_bins

    @hist = new Float32Array(@num_bins)

    @source = Collections('ColumnDataSource').create(
      data: {inner_radius:[], outer_radius:[], start_angle:[], end_angle:[], fill_alpha: []}
    )

    @range = Collections('Range1d').create({start: -20, end: 20})

    @model = Collections('Plot').create(
      x_range: @range.ref()
      y_range: @range.ref()
      border_fill: "#fff"
      canvas_width:  options.width
      canvas_height: options.height
      outer_width:   options.width
      outer_height:  options.height
      tools: []
      title: ""
    )

    glyph = Collections('GlyphRenderer').create({
      data_source: @source
      xdata_range: @range
      ydata_range: @range
      glyphspec: {
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
    })

    @model.add_renderers([glyph])
    @view = new @model.default_view(model: @model)

  update: (fft, fft_min, fft_max) ->
    df = (FREQ_SLIDER_MAX - FREQ_SLIDER_MIN)

    bin_min = Math.floor(fft_min/df)
    bin_max = bin_min + Math.floor((fft_max-fft_min)/df * (fft.length-1))

    bin_start = bin_min
    bin_size = Math.ceil((bin_max - bin_min) / @num_bins)
    for i in [0..@num_bins-1]
      @hist[i] = 0
      bin_end = Math.min(bin_start+bin_size-1, bin_max)
      for j in [bin_start..bin_end]
        @hist[i] += fft[j]
      bin_start += bin_size

    inner = []
    outer = []
    start = []
    end = []
    fill_alpha = []
    vals = []
    angle = 2*Math.PI/@num_bins
    for i in [0..(@hist.length-1)]
      n = @hist[i]/16
      for j in [0..n]
        vals.push(j)
        inner.push(2+j)
        outer.push(2+j+0.95)
        start.push((i+0.05)*angle)
        end.push((i+0.95)*angle)
        fill_alpha.push(1-0.08*j)

    @source.set('data', {
      inner_radius: inner, outer_radius: outer, start_angle: start, end_angle: end, fill_alpha: fill_alpha
    })
    @source.trigger('change', @source, {})

  render: () ->
    @view.render()


class SimpleIndexPlot
  constructor: (options) ->
    @source = Collections('ColumnDataSource').create(
      data: {idx: [], ys: []}
    )

    @xrange = Collections('Range1d').create({start: options.x0, end: options.x1})
    @yrange = Collections('Range1d').create({start: options.y0, end: options.y1})

    @model = Collections('Plot').create(
      x_range: @xrange.ref()
      y_range: @yrange.ref()
      border_fill: "#fff"
      canvas_width:  options.width
      canvas_height: options.height
      outer_width:   options.width
      outer_height:  options.height
      tools: []
      title: ""
    )

    xaxis = Collections('GuideRenderer').create(
      plot: @model.ref()
      guidespec: {
        type: 'linear_axis'
        dimension: 0
      }
    )

    yaxis = Collections('GuideRenderer').create(
      plot: @model.ref()
      guidespec: {
        type: 'linear_axis'
        dimension: 1
      }
    )

    yrule = Collections('GuideRenderer').create(
      plot: @model.ref()
      guidespec: {
        type: 'rule'
        dimension: 1
      }
    )

    glyph = Collections('GlyphRenderer').create({
      data_source: @source.ref()
      xdata_range: @xrange.ref()
      ydata_range: @yrange.ref()
      glyphspec: {
        type: 'line'
        line_color: 'darkblue'
        x: 'idx'
        y: 'ys'
      }
    })

    @model.add_renderers([glyph.ref(), xaxis.ref(), yaxis.ref(), yrule.ref()])
    @view = new @model.default_view(model: @model)

  update: (ys) ->
    if @idx?.length != ys.length
      @idx = new Array(ys.length)
      for i in [0..@idx.length-1]
        @idx[i] = @xrange.get('start') + (i/@idx.length)*@xrange.get('end')

    @source.set('data', {idx: @idx, ys: ys})
    @source.trigger('change', @source, {})

  set_xrange: (x0, x1) ->
    @xrange.set({'start': x0, 'end' : x1})

  set_yrange: (y0, y1) ->
    @yrange.set({'start': y0, 'end' : y1})

  render: () ->
    @view.render()

$(document).ready () ->
  spec = new SpectrogramApp()
  setInterval((() ->
    spec.request_data()),
    400)


