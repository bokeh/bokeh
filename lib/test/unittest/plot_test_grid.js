test('simple_grid_test', function(){
    expect(0)
    var data_source = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    }, {'local' : true});
    var container = Bokeh.Collections['GridPlotContainer'].create(
	{'render_loop' : true}, 
	{'local' : true})
    var div = $('<div style="border:1px solid black"></div>')    
    $('body').append(div)
    $('body').append($('<br/>'))
    var plot1 = Bokeh.scatter_plot(container, data_source, 'x', 'y', 'x', 'circle');
    var plot2 = Bokeh.scatter_plot(container, data_source, 'x', 'y', 'x', 'circle');
    window.plot = container
    window.plot1 = plot1
    window.plot2 = plot2
        
    container.set({'children' : [[plot1.ref(), plot2.ref()]]})	    
    window.myrender = function(){
	view = new Bokeh.GridPlotContainerView({'model' : container, 
						'render_loop' : true
					       })
	div.append(view.$el)		
	view.render()
    }    
    _.defer(window.myrender)
});

test('medium_grid_test', function(){
    expect(0)
    var data_source1 = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    }, {'local' : true});
    var data_source2 = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : 2},
		{x : 2, y : 3},
		{x : 3, y : 1},
		{x : 4, y : 5},
		{x : 5, y : 6}]
    }, {'local' : true});
    var container = Bokeh.Collections['GridPlotContainer'].create(
	{}, {'local' : true})
    var div = $('<div style="border:1px solid black"></div>')
    $('body').append(div)
    $('body').append($('<br/>'))    
    
    var plot1 = Bokeh.scatter_plot(container, data_source1, 'x', 'y', 'x', 'circle');
    var plot2 = Bokeh.scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
    var plot3 = Bokeh.scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
    var plot4 = Bokeh.scatter_plot(container, data_source1, 'x', 'y', 'x', 'circle');
    container.set({'children' : [[plot1.ref(), plot2.ref()], [plot3.ref(), plot4.ref()]]})
    _.defer(function(){
	view = new Bokeh.GridPlotContainerView({'model' : container, 
						'render_loop' : true
					       })
	div.append(view.$el)		
	view.render()
	plot3.set({'height' : 300})
    });
})

test('line_plot_grid_test', function(){
    expect(0)
    var data_source1 = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : -2},
		{x : 2, y : -3},
		{x : 3, y : -4},
		{x : 4, y : -5},
		{x : 5, y : -6}]
    }, {'local' : true});
    var data_source2 = Bokeh.Collections['ObjectArrayDataSource'].create({
	data : [{x : 1, y : 2},
		{x : 2, y : 3},
		{x : 3, y : 1},
		{x : 4, y : 5},
		{x : 5, y : 6}]
    }, {'local' : true});
    var container = Bokeh.Collections['GridPlotContainer'].create(
	{'render_loop' : true},
	{'local' : true});
    var div = $('<div style="border:1px solid black"></div>')
    $('body').append(div)
    $('body').append($('<br/>'))    

    var plot1 = Bokeh.scatter_plot(container, data_source1, 'x', 'y', 'x', 'circle');
    var plot2 = Bokeh.scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
    var plot3 = Bokeh.scatter_plot(container, data_source2, 'x', 'y', 'x', 'circle');
    var plot4 = Bokeh.line_plot(container, data_source1, 'x', 'y');
    container.set({'children' : [[plot1.ref(), plot2.ref()], [plot3.ref(), plot4.ref()]]})
    window.myrender = function(){
	view = new Bokeh.GridPlotContainerView({'model' : container, 
						'render_loop' : true
					       })
	div.append(view.$el)		
	view.render()
	plot3.set({'height' : 300})	
    }    
    _.defer(window.myrender)
})

