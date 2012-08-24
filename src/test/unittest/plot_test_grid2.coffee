test('simple_grid_test', ->
  expect(0)
  data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
  	data : [{x : 1, y : -2},
  		{x : 2, y : -3},
  		{x : 3, y : -4},
  		{x : 4, y : -5},
  		{x : 5, y : -6}]
      }, {'local' : true});
  container = Bokeh.Collections['GridPlotContainer'].create(
  	{'render_loop' : true}, 
  	{'local' : true})
  div = $('<div style="border:1px solid black"></div>')    
  $('body').append(div)
  $('body').append($('<br/>'))
  plot1 = Bokeh.scatter_plot(container, data_source, 'x', 'y', 'x', 'circle');
  plot2 = Bokeh.scatter_plot(container, data_source, 'x', 'y', 'x', 'circle');
  window.plot = container
  window.plot1 = plot1
  window.plot2 = plot2
        
  container.set({'children' : [[plot1.ref(), plot2.ref()]]})	    
  view = new Bokeh.GridPlotContainerView(
    {'model' : container, 'render_loop' : true})

  _.defer(->
  	div.append(view.$el)		
  	view.render()))


test('line_plot_grid_test', ->
  expect(0)
  data_source1 = Bokeh.Collections['ObjectArrayDataSource'].create({
  	data : [{x : 1, y : -2},
  		{x : 2, y : -3},
  		{x : 3, y : -4},
  		{x : 4, y : -5},
  		{x : 5, y : -6}]
      }, {'local' : true});
  data_source2 = Bokeh.Collections['ObjectArrayDataSource'].create({
  	data : [{x : 1, y : 2},
  		{x : 2, y : 3},
  		{x : 3, y : 1},
  		{x : 4, y : 5},
  		{x : 5, y : 6}]
      }, {'local' : true});
  container = Bokeh.Collections['GridPlotContainer'].create(
  	{'render_loop' : true},
  	{'local' : true});
  div = $('<div style="border:1px solid black"></div>')
  $('body').append(div)
  $('body').append($('<br/>'))    

  plot1 = Bokeh.scatter_plot(container, data_source1, 'x', 'y', 'x', 'circle');
  plot2 = Bokeh.scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
  plot3 = Bokeh.scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
  plot4 = Bokeh.line_plot(container, data_source1, 'x', 'y');
  container.set({'children' : [[plot1.ref(), plot2.ref()], [plot3.ref(), plot4.ref()]]})

  _.defer(->
  	view = new Bokeh.GridPlotContainerView(
      {'model' : container, 'render_loop' : true})
  	div.append(view.$el)		
  	view.render()
  	plot3.set({'height' : 300})
  	view2 = new Bokeh.GridPlotContainerView(
      {'model' : container, 'scale':0.75, 'render_loop' : true})
  	div.append(view2.$el)		
  	view2.render()))


