base = require("../base")
testutils = require("./testutils")

Collections = base.Collections
test('test_simple_plot',  ->
    expect(0)
    data_source = Collections('ObjectArrayDataSource').create({
      data : [{x : 1, y : -2},
        {x : 2, y : -3},
        {x : 3, y : -4},
        {x : 4, y : -5},
        {x : 5, y : -6}]
      }, {'local' : true})
    plotmodel = testutils.scatter_plot(null, data_source, 'x', 'y', null, 'circle');
    window.plot = plotmodel
    div = $('<div/>')
    $('body').append(div)
    myrender  =  ->
      view = new plotmodel.default_view('model' : plotmodel, 'render_loop' : true)
      div.append(view.$el)
      view.render()
    console.log('test_simple_plot')
    _.defer(myrender)
)

test('test_line_plot',  ->
    expect(0)

    data_source = Collections('ObjectArrayDataSource').create({
      data : [{x : 1, y : -2},
        {x : 2, y : -3},
        {x : 3, y : -4},
        {x : 4, y : -5},
        {x : 5, y : -6}]
      }, {'local' : true})
    plotmodel = testutils.line_plot(null, data_source, 'x', 'y', null, 'circle');
    window.plot = plotmodel
    div = $('<div style="border:1px solid black"></div>')
    $('body').append(div)
    myrender  =  ->
      view = new plotmodel.default_view('model' : plotmodel, 'render_loop' : true)
      div.append(view.$el)
      view.render()
    console.log('test_simple_plot')
    _.defer(myrender)
)

test('test_updating_plot', ->
    expect(0)
    data_source = Collections('ObjectArrayDataSource').create({
      data : [{x : 1, y : -2},
        {x : 2, y : -3},
        {x : 3, y : -4},
        {x : 4, y : -5},
        {x : 5, y : -6}]
      }, {'local' : true});
    plotmodel = testutils.scatter_plot(null, data_source, 'x', 'y', null, 'circle');
    plotmodel.set({'render_loop' : true})
    window.plot = plotmodel
    div = $('<div style="border:1px solid black"></div>')
    $('body').append(div)
    myrender  =  () ->
      view = new plotmodel.default_view('model' : plotmodel, 'render_loop' : true)
      div.append(view.$el)
      window.view=view
      view.render()
      view.viewstate.set({'width' : 300, 'height' : 300})
    _.defer(myrender)

)

test('test_colors_plot', ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create({
    data : [{x : 1, y : -2},
      {x : 2, y : -3},
      {x : 3, y : -4},
      {x : 4, y : -5},
      {x : 5, y : -6}]}, {'local' : true})

  plotmodel = testutils.scatter_plot(null, data_source, 'x', 'y', 'x', 'circle');
  plotmodel.set({'render_loop' : true})
  div = $('<div style="border:1px solid black"></div>')
  $('body').append(div)
  myrender = () ->
    view = new plotmodel.default_view(
      'model' : plotmodel,
    )
    div.append(view.$el)
    view.render();
    view.viewstate.set({'width' : 300, 'height' : 300});
  console.log("test_colors_plot")
  _.defer(myrender)
);

test('rectangular_plot_test', ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create({
    data : [{x : 1, y : -2},
      {x : 2, y : -3},
      {x : 3, y : -4},
      {x : 4, y : -5},
      {x : 5, y : -6}]
      }, {'local' : true});
  div = $('<div style="border:1px solid black"></div>')
  $('body').append(div)
  $('body').append($('<br/>'))
  plot1 = testutils.scatter_plot(null, data_source, 'x', 'y', 'x', 'circle');
  plot1.set('width' , 500)
  window.plot = container
  window.plot1 = plot1
  view = new plot1.default_view(model : plot1)
  window.view = view
  _.defer(->
    div.append(view.$el)
    view.render())
)
