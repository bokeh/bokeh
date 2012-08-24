
window.number_of_runs = 0
test('test_scale', ()->
  expect(0)
  if window.number_of_runs < 1
    data_source1 = Bokeh.Collections['ObjectArrayDataSource'].create({
      data : [{x : 1, y : -2},
        {x : 2, y : -3},
        {x : 3, y : -4},
        {x : 4, y : -5},
        {x : 5, y : -6}]
    }, {'local' : true})
    plot1 = Bokeh.scatter_plot(null, data_source1, 'x', 'y', 'x', 'circle')
    plot1.set({'render_loop' : true})
    console.log("first run")

    $('body').append("<div class='chartholder' id='mychart'></div>")
    $('body').append("<div class='chartholder' id='mychart2'></div>")

    window.myrender = () ->
      view_orig = new plot1.default_view(
        model : plot1,
        render_loop : true
      )
      $('#mychart').append(view_orig.el)
      view_orig.render()
      window.view_orig = view_orig

      view = new plot1.default_view(
        {'model' : plot1, 'scale': 0.5, 'render_loop' : true})
      $('#mychart2').append(view.el)
      view.render()
      window.view = view

    _.defer(window.myrender)
    window.number_of_runs += 1
)
