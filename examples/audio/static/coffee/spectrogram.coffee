Collections = require('base').Collections

class Spectrogram
  constructor: () ->
    console.log "initialize"
    @plot_model = @create_plot()
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
    #console.log "foo"

  render: () ->
    console.log "render"
    div = $('<div></div>')
    $('body').append(div)
    myrender  =  =>
      view = new @plot_model.default_view(model: @plot_model)
      div.append(view.$el)
      view.render()
    _.defer(myrender)

  create_plot: () ->
    console.log "create_plot"
    xrange = Collections('Range1d').create({start: 0, end: 10})
    yrange = Collections('Range1d').create({start: 0, end: 10})
    @plot_model = Collections('Plot').create()
    xaxis = Collections('LinearAxis').create(
      orientation: 'bottom'
      parent: @plot_model.ref()
      data_range: xrange.ref()
    )
    yaxis = Collections('LinearAxis').create(
      orientation: 'left',
      parent: @plot_model.ref()
      data_range: yrange.ref()
    )
    @plot_model.set(
      renderers: []
      axes: [xaxis.ref(), yaxis.ref()]
      tools: []
      width: 400
      height: 600
    )

$(document).ready () ->
  spec = new Spectrogram()
  setInterval(spec.request_data, 30)

