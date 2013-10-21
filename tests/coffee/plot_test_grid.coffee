base = require("../base")
Collections = base.Collections

testutils = require("./testutils")
scatter_plot = testutils.scatter_plot
line_plot = testutils.line_plot

test('simple_grid_test', ->
  expect(0)
  data_source = Collections('ObjectArrayDataSource').create({
    data : [{x : 1, y : -2},
      {x : 2, y : -3},
      {x : 3, y : -4},
      {x : 4, y : -5},
      {x : 5, y : -6}]
      }, {'local' : true});
  container = Collections('GridPlotContainer').create(
    {'render_loop' : true},
    {'local' : true})
  div = $('<div style="border:1px solid black"></div>')
  $('body').append(div)
  $('body').append($('<br/>'))
  plot1 = scatter_plot(container, data_source, 'x', 'y', 'x', 'circle');
  plot2 = scatter_plot(container, data_source, 'x', 'y', 'x', 'circle');
  window.plot = container
  window.plot1 = plot1
  window.plot2 = plot2

  container.set({'children' : [[plot1.ref(), plot2.ref()]]})
  view = new container.default_view(
    {'model' : container, 'render_loop' : true})
  window.view = view
  _.defer(->
    div.append(view.$el)
    view.render()))


test('line_plot_grid_test', ->
  expect(0)
  data_source1 = Collections('ObjectArrayDataSource').create({
    data : [{x : 1, y : -2},
      {x : 2, y : -3},
      {x : 3, y : -4},
      {x : 4, y : -5},
      {x : 5, y : -6}]
      }, {'local' : true});
  data_source2 = Collections('ObjectArrayDataSource').create({
    data : [{x : 1, y : 2},
      {x : 2, y : 3},
      {x : 3, y : 1},
      {x : 4, y : 5},
      {x : 5, y : 6}]
      }, {'local' : true});
  container = Collections('GridPlotContainer').create(
    {'render_loop' : true},
    {'local' : true});
  div = $('<div style="border:1px solid black"></div>')
  $('body').append(div)
  $('body').append($('<br/>'))

  plot1 = scatter_plot(container, data_source1, 'x', 'y', 'x', 'circle');
  plot2 = scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
  plot3 = scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
  plot4 = line_plot(container, data_source1, 'x', 'y');
  window.plot3 = plot3
  container.set({'children' : [[plot1.ref(), plot2.ref()], [plot3.ref(), plot4.ref()]]})
  _.defer(->
    view = new container.default_view(
      model : container
    )
    div.append(view.$el)
    view.render()
    #plot3.set({'height' : 300})
    view2 = new container.default_view(
      model : container
    )
    div.append(view2.$el)
    view2.render()
    window.view = view
    window.view2 = view2
    plotstate = view2.childviews[plot3.id].viewstate
    plotstate.set('height', 300)
    window.plotstate = plotstate
    return null
  )
)
